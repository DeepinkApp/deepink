// @vitest-environment jsdom

import { AttachmentsController } from '@core/features/attachments/AttachmentsController';
import { createFileManagerMock } from '@core/features/files/__tests__/mocks/createFileManagerMock';
import { createTextFile } from '@core/features/files/__tests__/mocks/createTextFile';
import { FilesController } from '@core/features/files/FilesController';
import { InMemoryFS } from '@core/features/files/InMemoryFS';
import { ZipFS } from '@core/features/files/ZipFS';
import { formatNoteLink, formatResourceLink } from '@core/features/links';
import { NotesController } from '@core/features/notes/controller/NotesController';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { createWorkspaceContext } from '@tests/utils/vaultContext';

import { NotesExporter } from '.';

const getWorkspaceContext = createWorkspaceContext();
const fileManager = createFileManagerMock();

test('Create notes', async () => {
	const { db, workspaceId } = getWorkspaceContext();
	const notesRegistry = new NotesController(db, workspaceId);
	const tagsRegistry = new TagsController(db, workspaceId);

	const attachmentsRegistry = new AttachmentsController(db, workspaceId);
	const filesRegistry = new FilesController(db, fileManager, workspaceId);

	// Upload files
	const file1Id = await filesRegistry.add(createTextFile('Text content of attachment'));
	await Promise.all(
		Array(10)
			.fill(null)
			.map(() => filesRegistry.add(createTextFile('UNUSED FILE'))),
	);

	// Create tags
	const tags = await Promise.all([
		tagsRegistry.add('foo', null),
		tagsRegistry.add('bar', null),
		tagsRegistry.add('baz', null),
	]);

	// Add notes
	const note1Id = await notesRegistry.add({
		title: 'Note 1',
		text: 'Hello world!',
	});

	await tagsRegistry.setAttachedTags(note1Id, tags);

	await notesRegistry.add({
		title: 'Note 2',
		text: `Mention for [Note 1](${formatNoteLink(note1Id)})`,
	});

	await attachmentsRegistry.set(
		await notesRegistry.add({
			title: 'Note 3',
			text: `Note with [attachment](${formatResourceLink(file1Id)})`,
		}),
		[file1Id],
	);

	await attachmentsRegistry.set(
		await notesRegistry.add({
			title: 'Note 4',
			text: `Note with [attachment](${formatResourceLink(
				file1Id,
			)}) and mention for [Note 1](${formatNoteLink(note1Id)})`,
		}),
		[file1Id],
	);
	await attachmentsRegistry.set(
		await notesRegistry.add({
			title: 'Note 5',
			text: `Note with [invalid attachment](${formatResourceLink(
				'00000000-0000-0000-0000-000000000000',
			)}) and mention for [invalid note](${formatNoteLink(
				'00000000-0000-0000-0000-000000000000',
			)})`,
		}),
		[file1Id],
	);
});

test('Export all notes and attached files', async () => {
	const { db, workspaceId } = getWorkspaceContext();
	const notesRegistry = new NotesController(db, workspaceId);
	const tagsRegistry = new TagsController(db, workspaceId);

	const filesRegistry = new FilesController(db, fileManager, workspaceId);

	const onProcessed = vi.fn();
	const exporter = new NotesExporter({
		filesRegistry,
		notesRegistry,
		tagsRegistry,
	});

	// Exported notes
	const exportTarget = createFileManagerMock();
	await expect(
		exporter.exportNotes(exportTarget, { onProcessed }),
	).resolves.not.toThrow();

	expect(onProcessed.mock.calls).toMatchSnapshot('onProcessed hook calls');

	const filesList = exportTarget.list();
	await expect(
		filesList.then((paths) =>
			paths.map((path) =>
				path.replaceAll(/[a-z\d]+(-[a-z\d]+){4}/g, '[REDACTED-UUID]'),
			),
		),
	).resolves.toMatchSnapshot('Files list');

	const notesPaths = await filesList.then((paths) =>
		paths.filter((path) => path.endsWith('.md')),
	);

	await expect(
		Promise.all(
			notesPaths.map(async (path, index) => {
				const content = await exportTarget.get(path);
				if (!content) throw new Error('File not found');

				return new TextDecoder()
					.decode(content)
					.replace(/created: \d+/, `created: ${100_000 + index}`)
					.replace(/updated: \d+/, `updated: ${200_000 + index}`)
					.replaceAll(/[a-z\d]+(-[a-z\d]+){4}/g, '[REDACTED-UUID]');
			}),
		),
	).resolves.toMatchSnapshot('Notes texts');
});

test('Export single note and it attachments', async () => {
	const { db, workspaceId } = getWorkspaceContext();
	const notesRegistry = new NotesController(db, workspaceId);
	const tagsRegistry = new TagsController(db, workspaceId);

	const filesRegistry = new FilesController(db, fileManager, workspaceId);

	const exporter = new NotesExporter({
		filesRegistry,
		notesRegistry,
		tagsRegistry,
	});

	// Exported single note
	const note = await notesRegistry
		.get()
		.then((notes) => notes.find((note) => note.content.title === 'Note 4'));
	if (!note) throw new Error('Note not found');

	const exportTarget = createFileManagerMock();
	await expect(exporter.exportNote(note.id, exportTarget)).resolves.not.toThrow();

	const filesList = exportTarget.list();
	await expect(
		filesList.then((paths) =>
			paths.map((path) =>
				path.replaceAll(/[a-z\d]+(-[a-z\d]+){4}/g, '[REDACTED-UUID]'),
			),
		),
	).resolves.toMatchSnapshot('Files list');

	const notesPaths = await filesList.then((paths) =>
		paths.filter((path) => path.endsWith('.md')),
	);

	await expect(
		Promise.all(
			notesPaths.map(async (path, index) => {
				const content = await exportTarget.get(path);
				if (!content) throw new Error('File not found');

				return new TextDecoder()
					.decode(content)
					.replace(/created: \d+/, `created: ${100_000 + index}`)
					.replace(/updated: \d+/, `updated: ${200_000 + index}`)
					.replaceAll(/[a-z\d]+(-[a-z\d]+){4}/g, '[REDACTED-UUID]');
			}),
		),
	).resolves.toMatchSnapshot('Notes texts');
});

test('Export all notes and attached files with custom file names', async () => {
	const { db, workspaceId } = getWorkspaceContext();
	const notesRegistry = new NotesController(db, workspaceId);
	const tagsRegistry = new TagsController(db, workspaceId);

	const filesRegistry = new FilesController(db, fileManager, workspaceId);

	const exporter = new NotesExporter(
		{
			filesRegistry,
			notesRegistry,
			tagsRegistry,
		},
		{
			filesRoot: '/files',
			noteFilename(note) {
				return [
					'notes',
					note.tags[0],
					[note.id, note.content.title].filter(Boolean).join('-') + '.md',
				]
					.filter(Boolean)
					.join('/');
			},
		},
	);

	// Exported notes
	const exportTarget = createFileManagerMock();
	await expect(exporter.exportNotes(exportTarget)).resolves.not.toThrow();

	const filesList = exportTarget.list();
	await expect(
		filesList.then((paths) =>
			paths.map((path) =>
				path.replaceAll(/[a-z\d]+(-[a-z\d]+){4}/g, '[REDACTED-UUID]'),
			),
		),
	).resolves.toMatchSnapshot('Files list');

	const notesPaths = await filesList.then((paths) =>
		paths.filter((path) => path.endsWith('.md')),
	);

	await expect(
		Promise.all(
			notesPaths.map(async (path, index) => {
				const content = await exportTarget.get(path);
				if (!content) throw new Error('File not found');

				return new TextDecoder()
					.decode(content)
					.replace(/created: \d+/, `created: ${100_000 + index}`)
					.replace(/updated: \d+/, `updated: ${200_000 + index}`)
					.replaceAll(/[a-z\d]+(-[a-z\d]+){4}/g, '[REDACTED-UUID]');
			}),
		),
	).resolves.toMatchSnapshot('Notes texts');
});

test('Export all notes and attached files as a zip file', async () => {
	const { db, workspaceId } = getWorkspaceContext();
	const notesRegistry = new NotesController(db, workspaceId);
	const tagsRegistry = new TagsController(db, workspaceId);

	const filesRegistry = new FilesController(db, fileManager, workspaceId);

	const exporter = new NotesExporter(
		{
			filesRegistry,
			notesRegistry,
			tagsRegistry,
		},
		{
			filesRoot: '/_files',
			noteFilename(note) {
				return [
					'notes',
					note.tags[0],
					[note.id, note.content.title].filter(Boolean).join('-') + '.md',
				]
					.filter(Boolean)
					.join('/');
			},
		},
	);

	// Export notes
	const fs1 = new ZipFS(new InMemoryFS());
	await expect(exporter.exportNotes(fs1)).resolves.not.toThrow();

	// Dump as zip file
	const zipBuffer = await fs1.dump();

	// Load zip file
	const fs2 = new ZipFS(new InMemoryFS());
	await fs2.load(zipBuffer as ArrayBuffer);

	const filesList = await fs2.list();
	expect(filesList.length).toBeGreaterThan(0);

	for (const file of filesList) {
		const file1 = await fs1.get(file);
		const file2 = await fs2.get(file);

		expect(new TextDecoder().decode(file1!)).toEqual(
			new TextDecoder().decode(file2!),
		);
		expect(file1).not.toBeFalsy();
		expect(file2).not.toBeFalsy();
	}
});
