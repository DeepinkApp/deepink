import { createWorkspaceContext } from '@tests/utils/vaultContext';

import { NotesController } from '../controller/NotesController';
import { NoteVersions } from './NoteVersions';

describe('Note version control', () => {
	const getWorkspaceContext = createWorkspaceContext();

	test('snapshot must be created only if latest version have changes with latest note data', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const registry = new NotesController(db, workspaceId);
		const history = new NoteVersions(db, workspaceId);

		// Fetch note
		const dataV1 = { title: 'Title', text: 'Text' };
		const noteId = await registry.add(dataV1);

		// No snapshots yet
		await expect(history.getList(noteId)).resolves.toHaveLength(0);

		// Make snapshot
		await history.snapshot(noteId);

		// Snapshot is created
		await expect(history.getList(noteId)).resolves.toEqual([
			expect.objectContaining(dataV1),
		]);

		// Any calls for snapshot creation must be ignored
		// since no changes with latest snapshot
		await history.snapshot(noteId);
		await history.snapshot(noteId);
		await history.snapshot(noteId);

		await expect(history.getList(noteId)).resolves.toHaveLength(1);

		// Update note
		const dataV2 = { title: 'Modified title', text: 'Modified text' };
		await registry.update(noteId, dataV2);

		// Make another snapshot
		await history.snapshot(noteId);

		await expect(history.getList(noteId)).resolves.toEqual([
			expect.objectContaining(dataV2),
			expect.objectContaining(dataV1),
		]);
	});

	test('the snapshots of different notes must not affect each other', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const registry = new NotesController(db, workspaceId);
		const history = new NoteVersions(db, workspaceId);

		// Create note
		const noteId1 = await registry.add({ title: 'Title', text: 'Text' });

		// Make snapshot
		await expect(history.getList(noteId1)).resolves.toHaveLength(0);
		await history.snapshot(noteId1);
		await expect(history.getList(noteId1)).resolves.toHaveLength(1);

		// Create another note and snapshot it
		const noteId2 = await registry.add({
			title: 'Another note',
			text: 'Another note',
		});
		await history.snapshot(noteId2);
		await expect(history.getList(noteId2)).resolves.toHaveLength(1);

		// Note 1 have no changes and new snapshots must not be added
		await history.snapshot(noteId1);
		await expect(history.getList(noteId1)).resolves.toHaveLength(1);
	});

	test('snapshot must be created when note content is updated', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const registry = new NotesController(db, workspaceId);
		const history = new NoteVersions(db, workspaceId);

		// Create note
		const noteId = await registry.add({ title: '', text: 'v1' });

		// Make snapshot
		await expect(history.getList(noteId)).resolves.toHaveLength(0);
		await history.snapshot(noteId);
		await expect(history.getList(noteId)).resolves.toHaveLength(1);

		// No changes - no snapshots
		await history.snapshot(noteId);
		await expect(history.getList(noteId)).resolves.toHaveLength(1);
		await history.snapshot(noteId);
		await expect(history.getList(noteId)).resolves.toHaveLength(1);

		// Update must create snapshot
		await registry.update(noteId, { title: '', text: 'v2' });
		await history.snapshot(noteId);
		await expect(history.getList(noteId)).resolves.toHaveLength(2);

		// Update to content equal to version 1 must create snapshot
		await registry.update(noteId, { title: '', text: 'v1' });
		await history.snapshot(noteId);
		await expect(history.getList(noteId)).resolves.toHaveLength(3);

		// No changes - no snapshots
		await history.snapshot(noteId);
		await expect(history.getList(noteId)).resolves.toHaveLength(3);
	});

	test('snapshot must always be created when parameter `force` is set', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const registry = new NotesController(db, workspaceId);
		const history = new NoteVersions(db, workspaceId);

		// Fetch note
		const noteId = await registry.add({ title: 'Title 1', text: 'Text 1' });
		const [noteDataV1] = await registry.getById([noteId]);

		// No snapshots yet
		await expect(history.getList(noteId)).resolves.toHaveLength(0);

		// Make snapshot
		await history.snapshot(noteId, { force: true });

		// Snapshot is created
		await expect(history.getList(noteId)).resolves.toEqual([
			expect.objectContaining(noteDataV1.content),
		]);

		// Update note
		const contentV2 = { title: 'Modified title', text: 'Modified text' };
		await registry.update(noteId, contentV2);

		// Snapshot is not changed
		await expect(history.getList(noteId)).resolves.toEqual([
			expect.objectContaining(noteDataV1.content),
		]);

		// Make another snapshot
		await history.snapshot(noteId, { force: true });
		await expect(history.getList(noteId)).resolves.toEqual([
			expect.objectContaining(contentV2),
			expect.objectContaining(noteDataV1.content),
		]);

		// Make another snapshot
		await history.snapshot(noteId, { force: true });
		await expect(history.getList(noteId)).resolves.toEqual([
			expect.objectContaining(contentV2),
			expect.objectContaining(contentV2),
			expect.objectContaining(noteDataV1.content),
		]);
	});

	test('when note is deleted, all versions must be deleted too', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const registry = new NotesController(db, workspaceId);
		const history = new NoteVersions(db, workspaceId);

		// Fetch note
		const noteId = await registry.add({ title: 'Title 1', text: 'Text 1' });

		await history.snapshot(noteId, { force: true });
		await history.snapshot(noteId, { force: true });
		await history.snapshot(noteId, { force: true });

		// Note have versions
		await expect(
			history.getList(noteId).then((object) => object.length),
		).resolves.toBeGreaterThan(0);

		// Note deletion also deletes all versions
		await registry.delete([noteId]);
		await expect(
			history.getList(noteId).then((object) => object.length),
		).resolves.toBe(0);
	});

	test('snapshot may be created with empty text', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const registry = new NotesController(db, workspaceId);
		const history = new NoteVersions(db, workspaceId);

		// Fetch note
		const dataV1 = { title: '', text: '' };
		const noteId = await registry.add(dataV1);

		// Make snapshot
		await history.snapshot(noteId);
		await expect(history.getList(noteId)).resolves.toEqual([
			expect.objectContaining(dataV1),
		]);

		// Next snapshot calls will be ignored, since no changes
		await history.snapshot(noteId);
		await expect(history.getList(noteId)).resolves.toEqual([
			expect.objectContaining(dataV1),
		]);

		// Update note
		const dataV2 = { title: 'Modified title', text: 'Modified text' };
		await registry.update(noteId, dataV2);

		// Make another snapshot
		await history.snapshot(noteId);
		await expect(history.getList(noteId)).resolves.toEqual([
			expect.objectContaining(dataV2),
			expect.objectContaining(dataV1),
		]);

		// Update note with empty text
		const dataV3 = { title: '', text: '' };
		await registry.update(noteId, dataV3);

		// Make another snapshot
		await history.snapshot(noteId);
		await expect(history.getList(noteId)).resolves.toEqual([
			expect.objectContaining(dataV3),
			expect.objectContaining(dataV2),
			expect.objectContaining(dataV1),
		]);
	});
});

describe('Delete note versions', () => {
	const getWorkspaceContext = createWorkspaceContext();

	test('create few notes', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const registry = new NotesController(db, workspaceId);

		await Promise.all(
			[
				{ title: 'Title 1', text: 'Text 1' },
				{ title: 'Title 2', text: 'Text 2' },
				{ title: 'Title 3', text: 'Text 3' },
			].map((note) => registry.add(note)),
		);
	});

	test('purge all versions for note', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const registry = new NotesController(db, workspaceId);
		const history = new NoteVersions(db, workspaceId);

		// Fetch any note
		const notes = await registry.get();
		const noteId = notes[1].id;

		// No versions for note
		await expect(history.getList(noteId)).resolves.toHaveLength(0);

		// Make snapshots
		await history.snapshot(noteId, { force: true });
		await history.snapshot(noteId, { force: true });
		await history.snapshot(noteId, { force: true });

		// Note have versions
		await expect(history.getList(noteId)).resolves.toHaveLength(3);

		await history.purge([noteId]);
		await expect(history.getList(noteId)).resolves.toHaveLength(0);
	});

	test('delete specific versions for note', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const registry = new NotesController(db, workspaceId);
		const history = new NoteVersions(db, workspaceId);

		// Fetch any note
		const notes = await registry.get();
		const noteId = notes[1].id;

		// No versions for note
		await expect(history.getList(noteId)).resolves.toHaveLength(0);

		// Make snapshots
		await history.snapshot(noteId, { force: true });
		await history.snapshot(noteId, { force: true });
		await history.snapshot(noteId, { force: true });

		// Versions now exists
		const versions1 = await history.getList(noteId);
		expect(versions1).toHaveLength(3);

		// Specific versions is exists
		const versionX = versions1[0];
		const versionY = versions1[1];
		expect(versions1).toContainEqual(versionX);
		expect(versions1).toContainEqual(versionY);

		// Deleted version must not to be in list
		await history.delete([versionY.id]);

		const versions2 = await history.getList(noteId);
		expect(versions2).toHaveLength(2);
		expect(versions2).toContainEqual(versionX);
		expect(versions2).not.toContainEqual(versionY);

		// Another deleted version must not to be in list too
		await history.delete([versionX.id]);

		const versions3 = await history.getList(noteId);
		expect(versions3).toHaveLength(1);
		expect(versions3).not.toContainEqual(versionX);
		expect(versions3).not.toContainEqual(versionY);
	});
});
