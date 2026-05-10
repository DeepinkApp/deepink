import { openSQLite } from '@core/database/sqlite/openSQLite';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { createWorkspaceContext, createWorkspaceId } from '@tests/utils/vaultContext';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { NotesController } from './NotesController';

vi.useFakeTimers();

test('filter by update time', async () => {
	const db = await openSQLite(createFileControllerMock());
	onTestFinished(db.close);

	const workspaceId = await createWorkspaceId(db.get());
	const notes = new NotesController(db.get(), workspaceId);

	vi.setSystemTime('01/01/2001 12:00');
	const note1 = await notes.add({ title: '2001', text: 'Dummy text' });

	vi.setSystemTime('01/01/2002 12:00');
	await notes.add({ title: '2002', text: 'Dummy text' });

	vi.setSystemTime('01/01/2003 12:00');
	await notes.add({ title: '2003', text: 'Dummy text' });

	// Filter by time
	await expect(
		notes.get({
			updatedAt: { from: new Date('01/01/2002 12:00') },
			sort: [{ by: 'createdAt', order: 'asc' }],
		}),
	).resolves.toEqual([
		expect.objectContaining({ content: expect.objectContaining({ title: '2002' }) }),
		expect.objectContaining({ content: expect.objectContaining({ title: '2003' }) }),
	]);

	await expect(
		notes.get({
			updatedAt: { to: new Date('01/01/2002 12:00') },
			sort: [{ by: 'createdAt', order: 'asc' }],
		}),
	).resolves.toEqual([
		expect.objectContaining({ content: expect.objectContaining({ title: '2001' }) }),
		expect.objectContaining({ content: expect.objectContaining({ title: '2002' }) }),
	]);

	// Update time and verify
	vi.setSystemTime('01/01/2005 12:00');
	await notes.update(note1, { title: '2005', text: 'Dummy text' });

	await expect(
		notes.get({ updatedAt: { to: new Date('01/01/2002 12:00') } }),
	).resolves.toEqual([
		expect.objectContaining({ content: expect.objectContaining({ title: '2002' }) }),
	]);

	await expect(
		notes.get({
			updatedAt: {
				from: new Date('01/01/2005 12:00'),
				to: new Date('01/01/2005 12:00'),
			},
		}),
	).resolves.toEqual([
		expect.objectContaining({ content: expect.objectContaining({ title: '2005' }) }),
	]);
});

test('sorts notes by pinned status', async () => {
	const db = await openSQLite(createFileControllerMock());
	onTestFinished(db.close);

	const workspaceId = await createWorkspaceId(db);
	const registry = new NotesController(db, workspaceId);

	const note1 = await registry.add({ title: '2001', text: 'Dummy text' });
	const note2 = await registry.add({ title: '2002', text: 'Dummy text' });
	const note3 = await registry.add({ title: '2003', text: 'Dummy text' });

	// Pin
	vi.setSystemTime('01/01/2010 12:00');
	await registry.updateMeta([note1], { isPinned: true });

	vi.setSystemTime('01/01/2011 12:00');
	await registry.updateMeta([note3], { isPinned: true });

	await expect(
		registry.query({ sort: [{ by: 'pinnedAt', order: 'desc' }] }),
	).resolves.toEqual([note3, note1, note2]);

	// Updating note content should not affect pin order
	vi.setSystemTime('01/01/2015 12:00');
	await registry.update(note1, { title: '2015', text: 'Dummy text' });

	await expect(
		registry.query({ sort: [{ by: 'pinnedAt', order: 'desc' }] }),
	).resolves.toEqual([note3, note1, note2]);
});

test('sorts notes by pinned status and update time', async () => {
	const db = await openSQLite(createFileControllerMock());
	onTestFinished(db.close);

	const workspaceId = await createWorkspaceId(db);
	const registry = new NotesController(db, workspaceId);

	const note1 = await registry.add({ title: '2001', text: 'Dummy text' });

	vi.setSystemTime('01/01/2002 12:00');
	const note2 = await registry.add({ title: '2002', text: 'Dummy text' });

	vi.setSystemTime('01/01/2004 12:00');
	const note3 = await registry.add({ title: '2004', text: 'Dummy text' });

	// Pin note1
	vi.setSystemTime('01/01/2010 12:00');
	await registry.updateMeta([note1], { isPinned: true });

	// Pinned notes come first, unpinned notes are sorted by update time
	await expect(
		registry.query({
			sort: [
				{ by: 'pinnedAt', order: 'desc' },
				{ by: 'updatedAt', order: 'desc' },
			],
		}),
	).resolves.toEqual([note1, note3, note2]);

	// Update an unpinned note
	vi.setSystemTime('01/01/2015 12:00');
	await registry.update(note2, { title: '2015', text: 'Dummy text' });

	await expect(
		registry.query({
			sort: [
				{ by: 'pinnedAt', order: 'desc' },
				{ by: 'updatedAt', order: 'desc' },
			],
		}),
	).resolves.toEqual([note1, note2, note3]);
});

describe('data fetching', () => {
	const getWorkspaceContext = createWorkspaceContext();

	const notesSample = Array(300)
		.fill(null)
		.map((_, idx) => {
			return {
				title: 'Note title #' + idx,
				text: 'Note text #' + idx,
			};
		});

	test('insert sample entries', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const registry = new NotesController(db, workspaceId);

		const ids: string[] = [];
		for (const note of notesSample) {
			ids.push(await registry.add(note));
		}

		const tags = new TagsController(db, workspaceId);
		await tags.setAttachedTags(ids[0], [await tags.add('foo', null)]);
		await tags.setAttachedTags(ids[1], [await tags.add('bar', null)]);
	});

	test('filter by tags', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const registry = new NotesController(db, workspaceId);
		const tags = new TagsController(db, workspaceId);

		const tagsList = await tags.getTags();

		await expect(
			registry.get({
				tags: [tagsList.find((tag) => tag.resolvedName === 'foo')!.id],
			}),
		).resolves.toHaveLength(1);

		await expect(
			registry.get({
				tags: [tagsList.find((tag) => tag.resolvedName === 'bar')!.id],
			}),
		).resolves.toHaveLength(1);
	});

	test('method query consider filters', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const registry = new NotesController(db, workspaceId);
		const tags = new TagsController(db, workspaceId);

		await expect(registry.query()).resolves.toHaveLength(300);
		await expect(registry.query({ limit: 100 })).resolves.toHaveLength(100);
		await expect(
			registry.query({ limit: 100, meta: { isDeleted: true } }),
		).resolves.toHaveLength(0);

		const tagsList = await tags.getTags();
		const fooTag = tagsList.find((tag) => tag.resolvedName === 'foo');
		expect(fooTag).toBeDefined();

		await expect(
			registry.query({
				tags: [fooTag!.id],
			}),
		).resolves.toHaveLength(1);
	});

	test('filter by tags and the deleted status', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const registry = new NotesController(db, workspaceId);
		const tags = new TagsController(db, workspaceId);

		const tagsList = await tags.getTags();

		const barTag = tagsList.find((tag) => tag.resolvedName === 'bar')!.id;
		const [{ id: noteId }] = await registry.get({
			limit: 1,
			tags: [barTag],
		});

		// set deleted status
		await registry.updateMeta([noteId], { isDeleted: true });
		await expect(
			registry.get({
				tags: [barTag],
				meta: { isDeleted: true },
			}),
		).resolves.toHaveLength(1);

		// reset deleted status
		await registry.updateMeta([noteId], { isDeleted: false });
		await expect(
			registry.get({
				tags: [barTag],
				meta: { isDeleted: true },
			}),
		).resolves.toHaveLength(0);
	});

	test('get entries by deletion status', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const registry = new NotesController(db, workspaceId);

		const notesId = await registry
			.get({ limit: 10 })
			.then((notes) => notes.map((note) => note.id));

		// update status for 10 notes
		vi.setSystemTime('2020-01-01T15:00:00.000Z');
		await registry.updateMeta(notesId, { isDeleted: true });
		await expect(registry.get({ meta: { isDeleted: true } })).resolves.toHaveLength(
			10,
		);

		await expect(
			registry.get({
				deletedAt: {
					from: new Date('2020-01-01T15:00:00.000Z'),
					to: new Date('2020-01-01T15:00:00.000Z'),
				},
			}),
			'Must find by exact time',
		).resolves.toHaveLength(10);

		await expect(
			registry.get({
				deletedAt: {
					from: new Date('2020-01-01T15:00:00.000Z'),
				},
			}),
			'Must find by exact "from" time',
		).resolves.toHaveLength(10);

		await expect(
			registry.get({
				deletedAt: {
					from: new Date('2020-01-01T14:00:00.000Z'),
				},
			}),
			'Must find by "from" time before deletion',
		).resolves.toHaveLength(10);

		await expect(
			registry.get({
				deletedAt: {
					from: new Date('2020-01-01T15:00:00.001Z'),
				},
			}),
			'Must not find by "from" time after deletion',
		).resolves.toHaveLength(0);

		await expect(
			registry.get({
				deletedAt: {
					to: new Date('2020-01-01T15:00:00.000Z'),
				},
			}),
			'Must find by exact "to" time',
		).resolves.toHaveLength(10);

		await expect(
			registry.get({
				deletedAt: {
					to: new Date('2020-01-01T15:00:00.001Z'),
				},
			}),
			'Must find by "to" time after deletion',
		).resolves.toHaveLength(10);

		await expect(
			registry.get({
				deletedAt: {
					to: new Date('2020-01-01T14:00:00.000Z'),
				},
			}),
			'Must not find by "to" time before deletion',
		).resolves.toHaveLength(0);

		// check only not deleted notes
		await expect(registry.get({ meta: { isDeleted: false } })).resolves.toHaveLength(
			notesSample.length - 10,
		);
	});

	test('filter notes by archived status', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const registry = new NotesController(db, workspaceId);

		const notesId = await registry
			.get({ limit: 30 })
			.then((notes) => notes.map((note) => note.id));

		await registry.updateMeta(notesId, { isArchived: true });
		await expect(registry.get({ meta: { isArchived: true } })).resolves.toHaveLength(
			30,
		);
		await expect(registry.get({ meta: { isArchived: false } })).resolves.toHaveLength(
			notesSample.length - 30,
		);
	});

	test('filters notes by bookmarks', async () => {
		const { db, workspaceId } = getWorkspaceContext();

		const registry = new NotesController(db, workspaceId);

		const notesId = await registry
			.get({ limit: 40 })
			.then((notes) => notes.map((note) => note.id));

		await registry.updateMeta(notesId, { isBookmarked: true });
		await expect(
			registry.get({ meta: { isBookmarked: true } }),
		).resolves.toHaveLength(40);
		await expect(
			registry.get({ meta: { isBookmarked: false } }),
		).resolves.toHaveLength(notesSample.length - 40);
	});

	test('filters notes by pinned status', async () => {
		const { db, workspaceId } = getWorkspaceContext();

		const registry = new NotesController(db, workspaceId);

		const notesId = await registry
			.get({ limit: 40 })
			.then((notes) => notes.map((note) => note.id));

		await registry.updateMeta(notesId, { isPinned: true });
		await expect(registry.get({ meta: { isPinned: true } })).resolves.toHaveLength(
			40,
		);
		await expect(registry.get({ meta: { isPinned: false } })).resolves.toHaveLength(
			notesSample.length - 40,
		);
	});

	test('method getLength consider filters', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const registry = new NotesController(db, workspaceId);

		const notesId = await registry
			.get({ limit: 10 })
			.then((notes) => notes.map((note) => note.id));
		await registry.updateMeta(notesId, { isVisible: false });

		await expect(registry.getLength({ meta: { isVisible: false } })).resolves.toBe(
			10,
		);
		await expect(registry.getLength({ meta: { isVisible: true } })).resolves.toBe(
			notesSample.length - 10,
		);
	});

	test('method getById returns notes in the requested order', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const registry = new NotesController(db, workspaceId);

		const notes = await registry.get({ limit: 10 });

		const shuffledNotes = notes.sort(() => Math.random() - 0.5);
		const shuffledIds = shuffledNotes.map((n) => n.id);

		await expect(registry.getById(shuffledIds)).resolves.toEqual(shuffledNotes);
	});

	test('method getById skips non-existent ids', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const registry = new NotesController(db, workspaceId);

		const notesId = await registry
			.get({ limit: 10 })
			.then((notes) => notes.map((note) => note.id));

		const notExistingNoteId = crypto.randomUUID();

		const shuffledIds = [...notesId, notExistingNoteId].sort(
			() => Math.random() - 0.5,
		);

		const foundNotes = await registry.getById(shuffledIds);
		expect(foundNotes).toHaveLength(10);
		expect(foundNotes).not.toContainEqual(
			expect.objectContaining({ id: notExistingNoteId }),
		);
	});
});
