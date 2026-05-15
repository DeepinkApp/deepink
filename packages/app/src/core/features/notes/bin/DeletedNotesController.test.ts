import ms from 'ms';
import { Mock } from 'vitest';
import { openSQLite } from '@core/database/sqlite/openSQLite';
import { createWorkspaceContext, createWorkspaceId } from '@tests/utils/vaultContext';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { NotesController } from '../controller/NotesController';
import { DeletedNotesController } from './DeletedNotesController';

const getWorkspaceContext = createWorkspaceContext();

vi.useFakeTimers();

const createNotes = async (notes: NotesController, count: number) =>
	Promise.all(
		Array(count)
			.fill(null)
			.map(() => notes.add({ title: '', text: '' })),
	);

const getNoteIds = async (notes: NotesController) =>
	notes.get().then((notes) => notes.map((note) => note.id));

describe('Purge expired notes', () => {
	test('Purge notes in bin that is deleted longer than retention time', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const notesController = new NotesController(db, workspaceId);
		const bin = new DeletedNotesController(
			{ notes: notesController },
			{ retentionTime: ms('10d') },
		);

		// Create notes
		vi.setSystemTime('2020-01-01T15:00:00.000Z');
		const noteIds = await createNotes(notesController, 100);
		expect(noteIds).toHaveLength(100);

		// Move to bin
		await notesController.updateMeta(noteIds, { isDeleted: true });

		// Purge
		await expect(bin.purgeExpired(), 'Nothing to purge').resolves.toBe(0);

		vi.setSystemTime('2020-01-11T14:59:59.999Z');
		await expect(bin.purgeExpired(), 'No expired notes yet').resolves.toBe(0);

		// Update deletion time for part of notes
		const slice1 = noteIds.slice(0, 50);

		vi.setSystemTime('2020-01-11T15:00:00.000Z');
		await notesController.updateMeta(slice1, { isDeleted: true });

		await expect(bin.purgeExpired(), 'Expired notes has been deleted').resolves.toBe(
			50,
		);
		await expect(getNoteIds(notesController)).resolves.toEqual(slice1);

		// Update deletion time
		const slice2 = noteIds.slice(0, 30);

		vi.setSystemTime('2020-01-12T15:00:00.000Z');
		await notesController.updateMeta(slice2, { isDeleted: true });
		await expect(bin.purgeExpired(), 'No expired notes yet').resolves.toBe(0);

		vi.setSystemTime('2020-01-21T15:00:00.000Z');
		await expect(bin.purgeExpired(), 'Expired notes has been deleted').resolves.toBe(
			20,
		);
		await expect(getNoteIds(notesController)).resolves.toEqual(slice2);

		vi.setSystemTime('2020-01-22T15:00:00.000Z');
		await expect(bin.purgeExpired(), 'Expired notes has been deleted').resolves.toBe(
			30,
		);
		await expect(getNoteIds(notesController)).resolves.toEqual([]);
	});

	test('Modification time is considered when required', async () => {
		const { db, workspaceId } = getWorkspaceContext();
		const notesController = new NotesController(db, workspaceId);
		const bin = new DeletedNotesController(
			{ notes: notesController },
			{ retentionTime: ms('10d'), considerModificationTime: true },
		);

		// Create notes
		vi.setSystemTime('2020-01-01T15:00:00.000Z');
		const noteIds = await createNotes(notesController, 100);
		expect(noteIds).toHaveLength(100);

		// Move to bin
		await notesController.updateMeta(noteIds, { isDeleted: true });

		// Purge
		await expect(bin.purgeExpired(), 'Nothing to purge').resolves.toBe(0);

		vi.setSystemTime('2020-01-11T14:59:59.999Z');
		await expect(bin.purgeExpired(), 'No expired notes yet').resolves.toBe(0);

		// Update deletion time for part of notes
		vi.setSystemTime('2020-01-11T15:00:00.000Z');

		const noteId = noteIds[0];
		await notesController.update(noteId, { title: '', text: '' });

		await expect(bin.purgeExpired(), 'Expired notes has been deleted').resolves.toBe(
			99,
		);
		await expect(getNoteIds(notesController)).resolves.toEqual([noteId]);

		vi.setSystemTime('2021-01-11T15:00:00.000Z');
		await notesController.update(noteId, { title: '', text: '' });
		await expect(bin.purgeExpired(), 'Nothing to purge').resolves.toBe(0);
		await expect(getNoteIds(notesController)).resolves.toEqual([noteId]);

		vi.setSystemTime('2021-01-20T15:00:00.000Z');
		await expect(bin.purgeExpired(), 'Nothing to purge').resolves.toBe(0);
		await expect(getNoteIds(notesController)).resolves.toEqual([noteId]);

		vi.setSystemTime('2021-01-21T15:00:00.000Z');
		await expect(bin.purgeExpired(), 'Retention policy is expired').resolves.toBe(1);
		await expect(getNoteIds(notesController)).resolves.toEqual([]);
	});
});

test('Empty bin', async () => {
	const { db, workspaceId } = getWorkspaceContext();
	const notesController = new NotesController(db, workspaceId);
	const bin = new DeletedNotesController(
		{ notes: notesController },
		{ retentionTime: ms('10d'), considerModificationTime: true },
	);

	// Create notes
	const noteIds = await createNotes(notesController, 100);
	expect(noteIds).toHaveLength(100);

	const sliceToDelete = noteIds.slice(0, 30);
	await getNoteIds(notesController).then((notes) => {
		expect(notes).toHaveLength(100);
		expect(notes).containSubset(sliceToDelete);
	});

	// Move to bin
	await notesController.updateMeta(sliceToDelete, { isDeleted: true });

	// Empty bin
	await expect(bin.empty()).resolves.toBe(30);
	await getNoteIds(notesController).then((notes) => {
		expect(notes).toHaveLength(70);
		expect(notes).not.containSubset(sliceToDelete);
	});

	await expect(bin.empty(), 'Bin is already empty').resolves.toBe(0);

	const restNotes = noteIds.slice(30);
	await notesController.updateMeta(restNotes, { isDeleted: true });

	const restoredNotes = restNotes.slice(0, 10);
	await notesController.updateMeta(restoredNotes, { isDeleted: false });

	// Empty bin
	await expect(bin.empty()).resolves.toBe(60);
	await getNoteIds(notesController).then((notes) => {
		expect(notes).toHaveLength(10);
		expect(notes).toEqual(restoredNotes);
	});
});

describe('Service must delete expired notes', () => {
	/**
	 * First we skip a time, then run timers once
	 * This way to change time is needed for large time spans, to not iterate too much timers
	 */
	const advanceTimersFast = async (time: number) => {
		vi.advanceTimersByTime(time);
		await vi.advanceTimersByTimeAsync(0);
	};

	test('Service deletes only expired notes just in time', async () => {
		vi.setSystemTime('2020-01-01T00:00:00.000Z');

		const dbFile = createFileControllerMock();
		const db = await openSQLite(dbFile);
		const workspaceId = await createWorkspaceId(db.get());
		const notesController = new NotesController(db.get(), workspaceId);
		const bin = new DeletedNotesController(
			{ notes: notesController },
			{ retentionTime: ms('1d'), considerModificationTime: true },
		);

		const onClean = vi.fn();
		const stopService = await bin.startService({ onClean });
		expect(onClean).toBeCalledTimes(0);

		// Create notes
		const noteIds = await createNotes(notesController, 100);
		expect(noteIds).toHaveLength(100);

		// Move to bin
		const notesToDelete = noteIds.slice(0, 50);
		await notesController.updateMeta(notesToDelete, { isDeleted: true });
		expect(onClean).toBeCalledTimes(0);

		// Nothing is deleted, since 1 second more left
		await vi.advanceTimersByTimeAsync(ms('23h') + ms('59m') + ms('59s'));
		expect(onClean).toBeCalledTimes(0);

		// Update data for slice of notes in bin
		const notesInBinToUpdate = notesToDelete.slice(0, 10);
		await Promise.all(
			notesInBinToUpdate.map((id) =>
				notesController.update(id, { title: '', text: '' }),
			),
		);

		// All notes that has not been updated must be deleted
		await vi.advanceTimersByTimeAsync(ms('1s'));
		expect(new Date().toISOString()).toBe('2020-01-02T00:00:00.000Z');
		expect(onClean).toHaveBeenLastCalledWith(40);
		expect(onClean).toBeCalledTimes(1);

		// Nothing is deleted, since 1 second more left
		await vi.advanceTimersByTimeAsync(ms('23h'));
		expect(onClean).toBeCalledTimes(1);

		// Restore notes
		await notesController.updateMeta(notesInBinToUpdate, { isDeleted: false });

		// Nothing to delete
		await vi.advanceTimersByTimeAsync(ms('1h'));
		expect(new Date().toISOString()).toBe('2020-01-03T00:00:00.000Z');
		expect(onClean).toBeCalledTimes(1);

		await vi.advanceTimersByTimeAsync(ms('1d'));
		expect(new Date().toISOString()).toBe('2020-01-04T00:00:00.000Z');
		expect(onClean).toBeCalledTimes(1);

		await vi.advanceTimersByTimeAsync(ms('1d'));
		expect(new Date().toISOString()).toBe('2020-01-05T00:00:00.000Z');
		expect(onClean).toBeCalledTimes(1);

		// Delete again
		await notesController.updateMeta(notesInBinToUpdate, { isDeleted: true });

		// 1 hour left
		await vi.advanceTimersByTimeAsync(ms('23h'));
		expect(new Date().toISOString()).toBe('2020-01-05T23:00:00.000Z');
		expect(onClean).toBeCalledTimes(1);

		// Delete expired notes
		await vi.advanceTimersByTimeAsync(ms('1h'));
		expect(new Date().toISOString()).toBe('2020-01-06T00:00:00.000Z');
		expect(onClean).toHaveBeenLastCalledWith(10);
		expect(onClean).toBeCalledTimes(2);

		await expect(stopService()).resolves.not.toThrow();

		await getNoteIds(notesController).then((notes) => {
			expect(notes).toEqual(noteIds.slice(50));
			expect(notes).toHaveLength(50);
		});
	});

	test('Service works fine with large time spans', async () => {
		vi.setSystemTime('2020-01-01T00:00:00.000Z');

		const dbFile = createFileControllerMock();
		const db = await openSQLite(dbFile);
		const workspaceId = await createWorkspaceId(db.get());
		const notesController = new NotesController(db.get(), workspaceId);
		const bin = new DeletedNotesController(
			{ notes: notesController },
			{ retentionTime: ms('5y'), considerModificationTime: true },
		);

		const onClean = vi.fn();
		const stopService = await bin.startService({ onClean });
		expect(onClean).toBeCalledTimes(0);

		// Create notes
		const noteIds = await createNotes(notesController, 100);
		expect(noteIds).toHaveLength(100);

		// Move to bin
		await notesController.updateMeta(noteIds, { isDeleted: true });
		expect(onClean).toBeCalledTimes(0);

		// Nothing is deleted
		await advanceTimersFast(ms('1y'));
		expect(onClean).toBeCalledTimes(0);
		await advanceTimersFast(ms('1y'));
		expect(onClean).toBeCalledTimes(0);
		await advanceTimersFast(ms('1y'));
		expect(onClean).toBeCalledTimes(0);
		await advanceTimersFast(ms('1y'));
		expect(onClean).toBeCalledTimes(0);

		await advanceTimersFast(ms('1y'));

		// Yep, due to a time shifts that's not 2025 year yet
		// But 5 years have passed
		expect(new Date().toISOString()).toBe('2024-12-31T06:00:00.000Z');

		// All expired notes must be deleted
		expect(onClean).toHaveBeenLastCalledWith(100);
		expect(onClean).toBeCalledTimes(1);

		await expect(stopService()).resolves.not.toThrow();
		await expect(getNoteIds(notesController)).resolves.toHaveLength(0);
	});

	test('Service may be restarted', async () => {
		vi.setSystemTime('2020-01-01T00:00:00.000Z');

		const dbFile = createFileControllerMock();
		const db = await openSQLite(dbFile);
		const workspaceId = await createWorkspaceId(db.get());
		const notesController = new NotesController(db.get(), workspaceId);
		const bin = new DeletedNotesController(
			{ notes: notesController },
			{ retentionTime: ms('1d'), considerModificationTime: true },
		);

		// Create notes
		const noteIds = await createNotes(notesController, 100);
		expect(noteIds).toHaveLength(100);

		// Move to bin
		await notesController.updateMeta(noteIds, { isDeleted: true });

		// Restart service every hour
		const serviceRuns: {
			onClean: Mock;
			stopPromise: Promise<any>;
		}[] = [];
		for (let i = 0; i < 20; i++) {
			// Run new service
			const onClean = vi.fn();
			const stopService = await bin.startService({ onClean: onClean });

			await vi.advanceTimersByTimeAsync(ms('20m'));
			expect(onClean).toBeCalledTimes(0);
			await vi.advanceTimersByTimeAsync(ms('20m'));
			expect(onClean).toBeCalledTimes(0);
			await vi.advanceTimersByTimeAsync(ms('20m'));
			expect(onClean).toBeCalledTimes(0);

			const stopPromise = stopService();
			await expect(stopPromise).resolves.not.toThrow();

			serviceRuns.push({ onClean, stopPromise });
		}

		// Run new service. Nothing is deleted
		const onClean = vi.fn();
		const stopService = await bin.startService({ onClean: onClean });

		await vi.advanceTimersByTimeAsync(ms('4h'));
		expect(onClean).toHaveBeenLastCalledWith(100);
		expect(onClean).toBeCalledTimes(1);

		await expect(stopService()).resolves.not.toThrow();

		await vi.advanceTimersByTimeAsync(ms('100h'));
		expect(onClean).toBeCalledTimes(1);

		// Previous runs have no deletions after service was stopped
		Promise.all(
			serviceRuns.map(async ({ onClean, stopPromise }) => {
				expect(onClean).toBeCalledTimes(0);
				await expect(stopPromise).resolves.not.toThrow();
			}),
		);
	});
});
