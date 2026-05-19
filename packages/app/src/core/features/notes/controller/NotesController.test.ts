import { openSQLite } from '@core/database/sqlite/openSQLite';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { createWorkspaceContext, createWorkspaceId } from '@tests/utils/vaultContext';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { NotesController } from './NotesController';

describe('CRUD operations', () => {
	const getWorkspaceContext = createWorkspaceContext();

	test('create few notes', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const registry = new NotesController(db, workspaceId);

		const entries = [
			{ title: 'Title 1', text: 'Text 1' },
			{ title: 'Title 2', text: 'Text 2' },
			{ title: 'Title 3', text: 'Text 3' },
		];

		const ids = await Promise.all(entries.map((note) => registry.add(note)));
		expect(ids).toHaveLength(entries.length);

		// TODO: move to another test
		// Entries match data
		await registry.get().then((dbEntries) => {
			dbEntries.forEach((dbEntry) => {
				const entryIndex = ids.indexOf(dbEntry.id);
				const originalEntry = entries[entryIndex];

				expect(dbEntry.content).toMatchObject(originalEntry);
			});
		});
	});

	test('update entry and get by id', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const registry = new NotesController(db, workspaceId);

		// Entries match data
		const entries = await registry.get();

		const entryV1 = entries[1];

		const modifiedData = { title: 'Modified title', text: 'Modified text' };
		await registry.update(entryV1.id, modifiedData);

		const [entryV2] = await registry.getById([entryV1.id]);
		expect(entryV2?.content).toMatchObject(modifiedData);
		expect(entryV2?.createdTimestamp).toBe(entryV1.createdTimestamp);
		expect(entryV2?.updatedTimestamp).not.toBe(entryV1.updatedTimestamp);
	});

	test('delete entries', async () => {
		const dbFile = createFileControllerMock();
		const managedDB = await openSQLite(dbFile);
		onTestFinished(() => managedDB.close());

		const workspaceId = await createWorkspaceId(managedDB.get());

		const registry = new NotesController(managedDB.get(), workspaceId);

		// Insert entries to test
		const notesSample = Array(300)
			.fill(null)
			.map((_, idx) => {
				return {
					title: 'Note title #' + idx,
					text: 'Note text #' + idx,
				};
			});

		await Promise.all(notesSample.map((note) => registry.add(note)));

		// Delete notes
		await registry.get({ limit: 100 }).then(async (notes) => {
			const lengthBeforeDelete = await registry.getLength();
			await registry.delete(notes.map((note) => note.id));
			await registry.getLength().then((length) => {
				expect(length).toBe(lengthBeforeDelete - 100);
			});
		});

		await registry.get({ limit: 1 }).then(async (notes) => {
			const lengthBeforeDelete = await registry.getLength();
			await registry.delete([notes[0].id]);
			await registry.getLength().then((length) => {
				expect(length).toBe(lengthBeforeDelete - 1);
			});
		});
	});

	test('delete with empty list does not throw', async () => {
		const dbFile = createFileControllerMock();
		const managedDB = await openSQLite(dbFile);
		onTestFinished(() => managedDB.close());
		const workspaceId = await createWorkspaceId(managedDB.get());

		const registry = new NotesController(managedDB.get(), workspaceId);

		await expect(registry.delete([])).resolves.not.toThrow();
	});

	test('update method ignores unexpected payload fields and correctly updates the note', async () => {
		const dbFile = createFileControllerMock();
		const managedDB = await openSQLite(dbFile);
		onTestFinished(() => managedDB.close());

		const workspaceId = await createWorkspaceId(managedDB.get());
		const registry = new NotesController(managedDB.get(), workspaceId);

		const noteId = await registry.add({ title: 'Title', text: 'Text' });

		// The object contains its own ID field, but it should not overwrite the note ID
		const updatedContentWithOwnId = {
			id: crypto.randomUUID(),
			text: 'Updated text',
			title: 'Updated title',
		};

		await registry.update(noteId, updatedContentWithOwnId);

		// The payload ID should not affect the note update
		await expect(registry.getById([noteId])).resolves.toStrictEqual([
			expect.objectContaining({
				id: noteId,
				content: {
					text: 'Updated text',
					title: 'Updated title',
				},
			}),
		]);
	});
});

test('Many instances reads the data consistently', async () => {
	const managedDB = await openSQLite(createFileControllerMock());
	onTestFinished(managedDB.close);

	const workspaceId = await createWorkspaceId(managedDB.get());

	// Add few notes via one controller
	const controller1 = new NotesController(managedDB.get(), workspaceId);

	const notes = [
		{ title: 'Title 1', text: 'Text 1' },
		{ title: 'Title 2', text: 'Text 2' },
		{ title: 'Title 3', text: 'Text 3' },
	];

	await Promise.all(notes.map((note) => controller1.add(note)));

	const notesList1 = await controller1.get();
	expect(notesList1).toHaveLength(3);

	// Read the state in another controller
	const controller2 = new NotesController(managedDB.get(), workspaceId);

	await expect(controller2.get()).resolves.toEqual(notesList1);
});

test('Get notes by pages', async () => {
	const managedDB = await openSQLite(createFileControllerMock());
	onTestFinished(managedDB.close);

	const workspaceId = await createWorkspaceId(managedDB.get());
	const registry = new NotesController(managedDB.get(), workspaceId);

	// Add data
	const notesSample = Array(300)
		.fill(null)
		.map((_, idx) => {
			return {
				title: 'Note title #' + idx,
				text: 'Note text #' + idx,
			};
		});

	const ids: string[] = [];
	for (const note of notesSample) {
		ids.push(await registry.add(note));
	}

	const tags = new TagsController(managedDB.get(), workspaceId);
	await tags.setAttachedTags(ids[0], [await tags.add('foo', null)]);
	await tags.setAttachedTags(ids[1], [await tags.add('bar', null)]);

	await expect(registry.getLength()).resolves.toBe(notesSample.length);

	// Invalid page must throw errors
	await expect(registry.get({ limit: 100, page: 0 })).rejects.toThrow();
	await expect(registry.get({ limit: 100, page: -100 })).rejects.toThrow();

	const page1 = await registry.get({
		limit: 100,
		page: 1,
		sort: { by: 'createdAt', order: 'asc' },
	});
	expect(page1[0].content).toMatchObject(notesSample[0]);

	const page2 = await registry.get({
		limit: 100,
		page: 2,
		sort: { by: 'createdAt', order: 'asc' },
	});
	expect(page2[0].content).toMatchObject(notesSample[100]);
});

describe('Meta data control', () => {
	const getWorkspaceContext = createWorkspaceContext();

	test('toggle note versions control', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const registry = new NotesController(db, workspaceId);

		// Create note
		const noteId = await registry.add({ title: 'Title', text: 'Text' });
		await expect(registry.getById([noteId])).resolves.toMatchObject([
			{
				id: noteId,
				isSnapshotsDisabled: false,
			},
		]);

		// Toggle snapshotting preferences
		await registry.updateMeta([noteId], { isSnapshotsDisabled: true });
		await expect(registry.getById([noteId])).resolves.toMatchObject([
			{
				id: noteId,
				isSnapshotsDisabled: true,
			},
		]);

		// Toggle snapshotting preferences back
		await registry.updateMeta([noteId], { isSnapshotsDisabled: false });
		await expect(registry.getById([noteId])).resolves.toMatchObject([
			{
				id: noteId,
				isSnapshotsDisabled: false,
			},
		]);
	});

	test('toggle note visibility', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const registry = new NotesController(db, workspaceId);

		// Create note
		const noteId = await registry.add({ title: 'Title', text: 'Text' });
		await expect(registry.getById([noteId])).resolves.toMatchObject([
			{
				id: noteId,
				isVisible: true,
			},
		]);
		await expect(registry.get()).resolves.toContainEqual(
			expect.objectContaining({
				id: noteId,
			}),
		);

		// Toggle snapshotting preferences
		await registry.updateMeta([noteId], { isVisible: false });
		await expect(registry.getById([noteId])).resolves.toMatchObject([
			{
				id: noteId,
				isVisible: false,
			},
		]);
		await expect(registry.get()).resolves.not.toContainEqual(
			expect.objectContaining({
				id: noteId,
			}),
		);

		// Toggle snapshotting preferences back
		await registry.updateMeta([noteId], { isVisible: true });
		await expect(registry.getById([noteId])).resolves.toMatchObject([
			{
				id: noteId,
				isVisible: true,
			},
		]);
		await expect(registry.get()).resolves.toContainEqual(
			expect.objectContaining({
				id: noteId,
			}),
		);
	});

	test('toggle note deletion status', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const registry = new NotesController(db, workspaceId);

		// Create notes
		const noteId = await registry.add({ title: 'Title', text: 'Text' });
		await expect(registry.getById([noteId])).resolves.toMatchObject([
			{
				id: noteId,
				isDeleted: false,
			},
		]);

		// toggle deleted status
		await registry.updateMeta([noteId], { isDeleted: true });
		await expect(registry.getById([noteId])).resolves.toMatchObject([
			{
				id: noteId,
				isDeleted: true,
			},
		]);

		// toggle deleted status back
		await registry.updateMeta([noteId], { isDeleted: false });
		await expect(registry.getById([noteId])).resolves.toMatchObject([
			{
				id: noteId,
				isDeleted: false,
			},
		]);
	});

	test('toggle note archived status', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const registry = new NotesController(db, workspaceId);

		// Create notes
		const noteId = await registry.add({ title: 'Title', text: 'Text' });
		await expect(registry.getById([noteId])).resolves.toMatchObject([
			{
				id: noteId,
				isArchived: false,
			},
		]);

		// toggle archive status
		await registry.updateMeta([noteId], { isArchived: true });
		await expect(registry.getById([noteId])).resolves.toMatchObject([
			{
				id: noteId,
				isArchived: true,
			},
		]);

		// toggle archive status back
		await registry.updateMeta([noteId], { isArchived: false });
		await expect(registry.getById([noteId])).resolves.toMatchObject([
			{
				id: noteId,
				isArchived: false,
			},
		]);
	});

	test('toggle note bookmarked status', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const registry = new NotesController(db, workspaceId);

		const noteId = await registry.add({ title: 'Title', text: 'Text' });
		await expect(registry.getById([noteId])).resolves.toMatchObject([
			{
				id: noteId,
				isBookmarked: false,
			},
		]);

		await registry.updateMeta([noteId], { isBookmarked: true });
		await expect(registry.getById([noteId])).resolves.toMatchObject([
			{
				id: noteId,
				isBookmarked: true,
			},
		]);

		await registry.updateMeta([noteId], { isBookmarked: false });
		await expect(registry.getById([noteId])).resolves.toMatchObject([
			{
				id: noteId,
				isBookmarked: false,
			},
		]);
	});

	test('toggle note update time', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const registry = new NotesController(db, workspaceId);

		// Create note
		const noteId = await registry.add(
			{ title: 'Title', text: 'Text' },
			{ updatedAt: 1000 },
		);
		await expect(registry.getById([noteId])).resolves.toMatchObject([
			{
				id: noteId,
				content: { title: 'Title', text: 'Text' },
				updatedTimestamp: 1000,
			},
		]);

		// Toggle snapshotting preferences
		await registry.updateMeta([noteId], { updatedAt: 5000 });
		await expect(registry.getById([noteId])).resolves.toMatchObject([
			{
				id: noteId,
				content: { title: 'Title', text: 'Text' },
				updatedTimestamp: 5000,
			},
		]);
	});
});

const getWorkspaceContext = createWorkspaceContext();

test('Batch notes updates', async () => {
	const { db, workspaceId } = getWorkspaceContext();
	const registry = new NotesController(db, workspaceId);

	// Create notes
	const noteIds = await Promise.all([
		registry.add({ title: 'note#1', text: '' }, { updatedAt: 1000 }),
		registry.add({ title: 'note#2', text: '' }, { updatedAt: 1000 }),
		registry.add({ title: 'note#3', text: '' }, { updatedAt: 1000 }),
	]);
	await expect(registry.getById(noteIds)).resolves.toMatchObject([
		{
			id: noteIds[0],
			updatedTimestamp: 1000,
		},
		{
			id: noteIds[1],
			updatedTimestamp: 1000,
		},
		{
			id: noteIds[2],
			updatedTimestamp: 1000,
		},
	]);
	// await expect(registry.query({ sort: { by: 'updatedAt', order: 'asc' } })).resolves.toStrictEqual(noteIds);

	// Update timestamps
	await registry.updateBatch([
		{ id: noteIds[2], updatedAt: 300, text: '', title: '' },
		{ id: noteIds[1], updatedAt: 200, text: '', title: '' },
		{ id: noteIds[0], updatedAt: 100, text: '', title: '' },
	]);

	await expect(registry.getById(noteIds)).resolves.toMatchObject([
		{
			id: noteIds[0],
			updatedTimestamp: 100,
		},
		{
			id: noteIds[1],
			updatedTimestamp: 200,
		},
		{
			id: noteIds[2],
			updatedTimestamp: 300,
		},
	]);

	// Update with no change a timestamps
	await registry.updateBatch([
		{ id: noteIds[2], updatedAt: false, text: '', title: '' },
		{ id: noteIds[1], updatedAt: false, text: '', title: '' },
		{ id: noteIds[0], updatedAt: false, text: '', title: '' },
	]);

	await expect(registry.getById(noteIds)).resolves.toMatchObject([
		{
			id: noteIds[0],
			updatedTimestamp: 100,
		},
		{
			id: noteIds[1],
			updatedTimestamp: 200,
		},
		{
			id: noteIds[2],
			updatedTimestamp: 300,
		},
	]);

	// Update with set current timestamps
	const timeBeforeUpdate1 = Date.now();
	await registry.updateBatch([
		{ id: noteIds[0], text: '', title: '' },
		{ id: noteIds[1], text: '', title: '' },
		{ id: noteIds[2], text: '', title: '' },
	]);

	const expectGreaterThanOrEqual = (expectedNumber: number) =>
		expect.toSatisfy((value) => typeof value === 'number' && value >= expectedNumber);

	await expect(registry.getById(noteIds)).resolves.toMatchObject([
		{
			id: noteIds[0],
			updatedTimestamp: expectGreaterThanOrEqual(timeBeforeUpdate1),
		},
		{
			id: noteIds[1],
			updatedTimestamp: expectGreaterThanOrEqual(timeBeforeUpdate1),
		},
		{
			id: noteIds[2],
			updatedTimestamp: expectGreaterThanOrEqual(timeBeforeUpdate1),
		},
	]);

	// Mixed update
	const timeBeforeUpdate2 = Date.now();
	await registry.updateBatch([
		{ id: noteIds[0], updatedAt: 100, title: 'Updated to 100', text: '' },
		{ id: noteIds[1], updatedAt: false, title: 'Timestamp is not changed', text: '' },
		{
			id: noteIds[2],
			updatedAt: undefined,
			title: 'Timestamp is set as current time',
			text: '',
		},
	]);

	await expect(registry.getById(noteIds)).resolves.toMatchObject([
		{
			id: noteIds[0],
			updatedTimestamp: 100,
			content: { title: 'Updated to 100' },
		},
		{
			id: noteIds[1],
			updatedTimestamp: expect.toSatisfy((value) => {
				expect(value).toBeGreaterThanOrEqual(timeBeforeUpdate1);
				expect(value).toBeLessThanOrEqual(timeBeforeUpdate2);
				return true;
			}),
			content: { title: 'Timestamp is not changed' },
		},
		{
			id: noteIds[2],
			updatedTimestamp: expect.toSatisfy((value) => {
				expect(value).toBeGreaterThanOrEqual(timeBeforeUpdate2);
				return true;
			}),
			content: { title: 'Timestamp is set as current time' },
		},
	]);
});
