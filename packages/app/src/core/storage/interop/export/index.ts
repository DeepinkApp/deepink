import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkParseFrontmatter from 'remark-parse-frontmatter';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { stringify as stringifyYaml } from 'yaml';
import { IFilesStorage } from '@core/features/files';
import { FilesController } from '@core/features/files/FilesController';
import { getAppResourceDataInUrl } from '@core/features/links';
import { INote, NoteId } from '@core/features/notes';
import { INotesController } from '@core/features/notes/controller';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { getPathSegments, getRelativePath, joinPathSegments } from '@utils/fs/paths';

import { replaceUrls } from '../utils/mdast';

export type NoteExportData = INote & { tags: string[] };

export type ExportProgress = { total: number; processed: number };

type ExportContext = {
	files: IFilesStorage;
	/**
	 * Saves an attachment by id and returns absolute path to a file
	 */
	saveAttachment: (id: string) => Promise<string | null>;

	/**
	 * Return persistent note data per export session
	 */
	getNoteData: (id: string) => Promise<NoteExportData | null>;

	/**
	 * Resolves note to unique path
	 *
	 * Path are persistent per note and unique in context
	 */
	resolveNotePath: (note: NoteExportData) => string;
};

type Config = {
	filesRoot: string;
	noteFilename?: (note: NoteExportData) => string;
	notesFetchLimit?: number;
};

export class NotesExporter {
	private readonly config: Config;
	constructor(
		private readonly context: {
			notesRegistry: INotesController;
			filesRegistry: FilesController;
			tagsRegistry: TagsController;
		},
		config?: Partial<Config>,
	) {
		this.config = {
			filesRoot: '_resources',
			...config,
		};
	}

	private async exportSingleNote(note: NoteExportData, context: ExportContext) {
		const notePath = getPathSegments(context.resolveNotePath(note));

		const markdownProcessor = unified()
			.use(remarkParse)
			.use(remarkParseFrontmatter)
			.use(remarkFrontmatter, ['yaml', 'toml'])
			.use(remarkGfm)
			.use(remarkStringify, { bullet: '-', listItemIndent: 'one' })
			.freeze();

		const mdTree = markdownProcessor.parse(note.content.text);

		// TODO: insert frontmatter optionally
		mdTree.children.unshift({
			type: 'yaml',
			value: stringifyYaml({
				title: note.content.title,
				created: note.createdTimestamp,
				updated: note.updatedTimestamp,
				tags: note.tags,
			}),
		});

		await replaceUrls(
			mdTree,
			async (nodeUrl) => {
				const appResource = getAppResourceDataInUrl(nodeUrl);

				if (!appResource) return nodeUrl;

				// Format note link
				if (appResource.type === 'note') {
					const noteData = await context.getNoteData(appResource.id);

					// Don't change URL if can't found data
					if (!noteData) return nodeUrl;

					return getRelativePath(
						context.resolveNotePath(noteData),
						notePath.dirname,
					);
				}

				// Save attachment and format link
				const filePath = await context.saveAttachment(appResource.id);
				return filePath ? getRelativePath(filePath, notePath.dirname) : nodeUrl;
			},
			true,
		);

		return markdownProcessor.stringify(mdTree);
	}

	public async exportNotes(
		files: IFilesStorage,
		{
			onProcessed,
		}: {
			onProcessed?: (info: ExportProgress) => void;
		} = {},
	) {
		const { notesRegistry } = this.context;

		let progress = 0;
		const context = this.createContext(files);
		// eslint-disable-next-line no-constant-condition
		for (let page = 1; true; page++) {
			const totalNotes = await notesRegistry.getLength();
			const notes = await notesRegistry.get({
				limit: this.config.notesFetchLimit ?? 10_000,
				page,
				sort: [{ by: 'createdAt', order: 'asc' }],
			});

			// Complete when no more notes left
			if (notes.length === 0) break;

			await Promise.all(
				notes.map(async (note) => {
					const tags = await this.getNoteTags(note.id);
					const noteData = { ...note, tags };
					const noteDump = await this.exportSingleNote(noteData, context);

					await files.write(
						context.resolveNotePath(noteData),
						new TextEncoder().encode(noteDump).buffer,
					);

					// Notify progress
					++progress;
					if (onProcessed) {
						onProcessed({
							total: totalNotes,
							processed: progress,
						});
					}
				}),
			);
		}
	}

	// TODO: implement recursive mode, to collect references
	public async exportNote(noteId: string, files: IFilesStorage) {
		const exportContext = this.createContext(files);

		const noteData = await exportContext.getNoteData(noteId);
		if (!noteData) return;

		const noteDump = await this.exportSingleNote(noteData, exportContext);
		await files.write(
			exportContext.resolveNotePath(noteData),
			new TextEncoder().encode(noteDump).buffer,
		);
	}

	private createContext(files: IFilesStorage): ExportContext {
		const { notesRegistry, filesRegistry } = this.context;
		const fetchedFiles: Record<string, Promise<string | null>> = {};
		const noteNames: Record<NoteId, string> = {};

		return {
			files,
			saveAttachment: async (id: string) => {
				// Fetch file and upload
				if (!(id in fetchedFiles)) {
					fetchedFiles[id] = Promise.resolve().then(async () => {
						const file = await filesRegistry.get(id);
						if (!file) return null;

						const fileName = `${id}-${file.name}`;
						const path = joinPathSegments([this.config.filesRoot, fileName]);

						const buffer = await file.arrayBuffer();

						await files.write(path, buffer);
						return path;
					});
				}

				return fetchedFiles[id];
			},
			getNoteData: async (noteId: string) => {
				const [note] = await notesRegistry.getById([noteId]);
				if (!note) return null;

				const tags = await this.getNoteTags(note.id);
				return { ...note, tags };
			},
			resolveNotePath: (note: NoteExportData) => {
				if (!noteNames[note.id]) {
					const filename = this.config.noteFilename?.(note) || `${note.id}.md`;
					noteNames[note.id] = joinPathSegments([filename]);
				}

				return noteNames[note.id];
			},
		};
	}

	private async getNoteTags(noteId: string) {
		const { tagsRegistry } = this.context;
		return tagsRegistry
			.getAttachedTags(noteId)
			.then((tags) =>
				tags.map((tag) => tag.resolvedName).sort((a, b) => (b > a ? -1 : 1)),
			);
	}
}
