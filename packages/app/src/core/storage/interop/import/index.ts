import pLimit from 'p-limit';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkParseFrontmatter from 'remark-parse-frontmatter';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { remove } from 'unist-util-remove';
import { z } from 'zod';
import { AttachmentsController } from '@core/features/attachments/AttachmentsController';
import { IFilesStorage } from '@core/features/files';
import { FilesController } from '@core/features/files/FilesController';
import { formatNoteLink, formatResourceLink } from '@core/features/links';
import { INotesController } from '@core/features/notes/controller';
import { NoteVersions } from '@core/features/notes/history/NoteVersions';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { findParentTag } from '@core/features/tags/utils';
import { getPathSegments, getResolvedPath } from '@utils/fs/paths';

import { replaceUrls } from '../utils/mdast';

export type NotesImporterDeps = {
	notesRegistry: INotesController;
	noteVersions?: NoteVersions;
	tagsRegistry: TagsController;
	filesRegistry: FilesController;
	attachmentsRegistry: AttachmentsController;
};

export interface NotesImporterWorkerAPI {
	import(
		deps: NotesImporterDeps,
		files: IFilesStorage,
		config?: {
			config?: NotesImporterConfig;
			options?: NotesImportOptions;
		},
	): Promise<void>;
}

export type OnProcessedPayload = {
	stage: 'parsing' | 'uploading' | 'updating';
	total: number;
	processed: number;
};

type OnProcessedHook = (info: OnProcessedPayload) => void;
const createNotifier = ({
	stage,
	total,
	callback,
}: {
	stage: OnProcessedPayload['stage'];
	total: number;
	callback?: OnProcessedHook;
}) => {
	let counter = 0;

	return {
		getStats() {
			return { total, processed: counter };
		},
		notify: () => {
			counter++;
			if (callback) callback({ stage, total, processed: counter });
		},
	};
};

const RawNoteMetaScheme = z
	.object({
		title: z.string().trim().min(1).optional().catch(undefined),
		tags: z
			.string()
			.array()
			.transform((tags) => tags.map((tag) => tag.trim()).filter(Boolean))
			.optional()
			.catch(undefined),
	})
	.catch({});

type Config = {
	ignorePaths: string[];
	noteExtensions: string[];
	convertPathToTag: 'never' | 'fallback' | 'always';
};

export type NotesImporterConfig = Partial<Config>;
export type NotesImportOptions = {
	abortSignal?: AbortSignal;
	onProcessed?: OnProcessedHook;
};

// TODO: run import and export in worker
export class NotesImporter {
	private readonly config: Config;
	constructor(
		private readonly deps: NotesImporterDeps,
		options: NotesImporterConfig = {},
	) {
		this.config = {
			noteExtensions: ['.md'],
			ignorePaths: [],
			convertPathToTag: 'fallback',
			...options,
		};
	}

	public async import(
		files: IFilesStorage,
		{ abortSignal, onProcessed }: NotesImportOptions = {},
	) {
		const checkForAbortion = () => {
			abortSignal?.throwIfAborted();
		};

		const { notesRegistry, noteVersions, tagsRegistry, attachmentsRegistry } =
			this.deps;

		const textDecoder = new TextDecoder('utf-8');
		const markdownProcessor = unified()
			.use(remarkParse)
			.use(remarkParseFrontmatter)
			.use(remarkFrontmatter, ['yaml', 'toml'])
			.use(remarkGfm)
			.use(remarkStringify, { bullet: '-', listItemIndent: 'one' })
			.freeze();

		const createdNotes: Record<string, { id: string; path: string }> = {};
		const attachmentPathsToUpload = new Set<string>();

		// Process files and add note drafts
		// On this stage we collect used resources and add semi-raw note texts to DB
		const filePathsList = await files.list();
		const parsingProgress = createNotifier({
			stage: 'parsing',
			total: filePathsList.length,
			callback: onProcessed,
		});
		for (const filename of filePathsList) {
			checkForAbortion();

			// Handle only notes
			if (!this.isNotePath(filename)) {
				parsingProgress.notify();
				continue;
			}

			const fileContent = await files.get(filename);
			if (!fileContent) {
				parsingProgress.notify();
				continue;
			}

			const rawText = textDecoder.decode(fileContent);
			const mdTree = markdownProcessor.parse(rawText);

			const fileAbsolutePathSegments = getPathSegments(filename);

			// Remove header node with meta data parsed by frontmatter
			remove(mdTree, 'yaml');

			// Resolve URLs to absolute paths in AST and collect attachments in use
			await replaceUrls(mdTree, async (nodeUrl) => {
				const absolutePath = getResolvedPath(
					nodeUrl,
					fileAbsolutePathSegments.dirname,
				);

				// TODO: use set for O(1) access
				const foundPath = [absolutePath, decodeURI(absolutePath)].find((path) =>
					filePathsList.includes(path),
				);

				// Leave original URL as is if file does not exist in files for import
				if (!foundPath) return nodeUrl;

				// Collect attachments paths
				if (!this.isNotePath(foundPath)) {
					attachmentPathsToUpload.add(foundPath);
				}

				// Set absolute path, to replace it later to an app link
				return foundPath;
			});

			// Add note draft
			const noteMeta = RawNoteMetaScheme.parse(
				markdownProcessor.processSync(rawText).data.frontmatter,
			);

			// Extract title
			let title = noteMeta.title;
			if (!title) {
				const { basename } = fileAbsolutePathSegments;
				const noteExtension = this.config.noteExtensions.find((ext) =>
					basename.toLowerCase().endsWith(ext.toLowerCase()),
				);

				title = noteExtension
					? basename.slice(0, -noteExtension.length)
					: basename;
			}

			const noteId = await notesRegistry.add(
				{
					title,
					// TODO: do not change original note markup (like bullet points marker style, escaping chars)
					text: markdownProcessor.stringify(mdTree),
				},
				{ isVisible: false },
			);

			// Attach tags
			if (noteMeta.tags && noteMeta.tags.length > 0) {
				await tagsRegistry.setAttachedTags(
					noteId,
					await this.getTagIds(noteMeta.tags),
				);
			}

			createdNotes[filename] = {
				id: noteId,
				path: fileAbsolutePathSegments.dirname,
			};

			parsingProgress.notify();
		}

		// TODO: limit concurrency for case with many large files
		// Upload attached files concurrently
		const filePathToIdMap: Record<string, string> = {};
		const uploadingProgress = createNotifier({
			stage: 'uploading',
			total: attachmentPathsToUpload.size,
			callback: onProcessed,
		});
		await Promise.all(
			// Remove duplicates
			Array.from(attachmentPathsToUpload).map(async (filePath) => {
				// TODO: cancel uploading for all files
				checkForAbortion();
				const fileId = await this.getFileId(filePath, files);
				if (fileId) {
					filePathToIdMap[filePath] = fileId;
				}

				uploadingProgress.notify();
			}),
		);

		// Update note drafts to complete import
		const notesToUpdate = Object.values(createdNotes);
		const updatingProgress = createNotifier({
			stage: 'updating',
			total: notesToUpdate.length,
			callback: onProcessed,
		});

		const handleUpdate = pLimit(10);
		await Promise.all(
			notesToUpdate.map(({ id: noteId, path: noteDirPath }) =>
				handleUpdate(async () => {
					checkForAbortion();

					const [note] = await notesRegistry.getById([noteId]);
					if (!note) throw new Error('Note with such id does not exist');

					const noteTree = markdownProcessor.parse(note.content.text);

					// Update URLs and collect attached files
					const attachedFilesIds = new Set<string>();
					// Here we replace temporary absolute paths to app references
					await replaceUrls(noteTree, async (absoluteUrl) => {
						const createdNote = createdNotes[absoluteUrl];
						if (createdNote) {
							// TODO: record back-link to note
							return formatNoteLink(createdNote.id);
						}

						const fileId = filePathToIdMap[absoluteUrl];
						if (fileId) {
							// Record file id as used
							attachedFilesIds.add(fileId);

							return formatResourceLink(fileId);
						}

						return absoluteUrl;
					});

					// Update note text
					await notesRegistry.update(note.id, {
						...note.content,
						text: markdownProcessor.stringify(noteTree),
					});

					// Attach files
					await attachmentsRegistry.set(noteId, Array.from(attachedFilesIds));

					// Attach tag equal to note directory path
					const { convertPathToTag } = this.config;
					if (convertPathToTag !== 'never' && noteDirPath !== '/') {
						const attachedTagIds = await tagsRegistry
							.getAttachedTags(noteId)
							.then((tags) => tags.map((tag) => tag.id));

						const isFallbackTagNeeded = attachedTagIds.length === 0;
						if (isFallbackTagNeeded || convertPathToTag === 'always') {
							const tagName = noteDirPath
								.split('/')
								.filter(Boolean)
								.join('/');
							const [pathTagId] = await this.getTagIds([tagName]);

							await tagsRegistry.setAttachedTags(noteId, [
								...attachedTagIds,
								pathTagId,
							]);
						}
					}

					if (noteVersions) {
						await noteVersions.snapshot(noteId);
					}

					updatingProgress.notify();
				}),
			),
		);

		await notesRegistry.updateMeta(
			Object.values(createdNotes).map((note) => note.id),
			{ isVisible: true },
		);
	}

	private isNotePath(filePath: string) {
		// Check file name extension
		if (
			!this.config.noteExtensions.some((ext) =>
				filePath.toLowerCase().endsWith(ext.toLowerCase()),
			)
		)
			return false;

		// Check path
		if (this.config.ignorePaths.some((rootPath) => filePath.startsWith(rootPath)))
			return false;

		return true;
	}

	private async getTagIds(tags: string[]) {
		const { tagsRegistry } = this.deps;

		const tagsToAttach: string[] = [];
		for (const resolvedTagName of tags) {
			const tags = await tagsRegistry.getTags();

			// Find exists tag
			const foundTag = tags.find((tag) => tag.resolvedName === resolvedTagName);
			if (foundTag) {
				tagsToAttach.push(foundTag.id);
				continue;
			}

			// Find parent tag and create sub tag
			const parentTag = findParentTag(resolvedTagName, tags);
			if (parentTag) {
				const parentTagWithPrefixLength = parentTag.resolvedName.length + 1;
				const tagNamePartToAdd = resolvedTagName.slice(parentTagWithPrefixLength);
				const createdTagId = await tagsRegistry.add(
					tagNamePartToAdd,
					parentTag.id,
				);
				tagsToAttach.push(createdTagId);
				continue;
			}

			// Create full resolved tag
			const createdTagId = await tagsRegistry.add(resolvedTagName, null);
			tagsToAttach.push(createdTagId);
		}

		return tagsToAttach;
	}

	private readonly uploadedFiles: Record<string, Promise<string | null>> = {};

	/**
	 * Returns file id by its path. Uploads file if not uploaded yet
	 */
	private async getFileId(url: string, files: IFilesStorage) {
		const { filesRegistry } = this.deps;

		// Upload new files
		if (!(url in this.uploadedFiles)) {
			this.uploadedFiles[url] = Promise.resolve().then(async () => {
				const buffer = await files.get(url);
				if (!buffer) return null;

				return filesRegistry.add(
					new File([buffer], getPathSegments(url).basename),
				);
			});
		}

		return this.uploadedFiles[url];
	}
}
