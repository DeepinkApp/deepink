import z from 'zod';
import { openSQLite } from '@core/database/sqlite/openSQLite';
import { InMemoryFS } from '@core/features/files/InMemoryFS';
import { StateFile } from '@core/features/files/StateFile';
import { createWorkspaceId } from '@tests/utils/vaultContext';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { FlexSearchIndex } from '../../../database/flexsearch/FlexSearchIndex';

import { NotesController } from './NotesController';
import { NotesTextIndexer } from './NotesTextIndexer';

vi.useFakeTimers();

test('incremental index building', async () => {
	const db = await openSQLite(createFileControllerMock());
	onTestFinished(db.close);

	const index = new FlexSearchIndex(new InMemoryFS());

	const workspaceId = await createWorkspaceId(db.get());
	const notes = new NotesController(db.get(), workspaceId, index);

	const indexScannerFile = createFileControllerMock();
	const indexScanner = new NotesTextIndexer(
		notes,
		index,
		new StateFile(indexScannerFile, z.any()),
	);

	// Scan for empty notes
	vi.setSystemTime('01/01/2000 12:00');
	await vi.runAllTimersAsync();
	await expect(indexScanner.update(), 'No notes to scan').resolves.toBe(0);

	// Add notes and scan
	vi.setSystemTime('01/01/2001 12:00');
	await vi.runAllTimersAsync();
	const note1 = await notes.add({ title: '2001', text: 'Dummy text' });

	vi.setSystemTime('01/01/2002 12:00');
	await vi.runAllTimersAsync();
	await notes.add({ title: '2002', text: 'Dummy text' });

	await expect(indexScanner.update(), 'All notes is now in index').resolves.toBe(2);
	await expect(notes.get({ search: { text: 'dummy text' } })).resolves.toEqual([
		expect.objectContaining({ content: expect.objectContaining({ title: '2001' }) }),
		expect.objectContaining({ content: expect.objectContaining({ title: '2002' }) }),
	]);

	// Can't find texts that is not in index yet
	vi.setSystemTime('01/01/2003 12:00');
	await vi.runAllTimersAsync();
	await notes.update(note1, { title: '2005', text: 'Updated demo text' });

	await expect(notes.get({ search: { text: 'updated demo' } })).resolves.toEqual([]);

	// Can find the texts after index
	await expect(indexScanner.update(), 'All notes is now in index').resolves.toBe(1);
	await expect(notes.get({ search: { text: 'updated demo' } })).resolves.toEqual([
		expect.objectContaining({ content: expect.objectContaining({ title: '2005' }) }),
	]);

	// Deletion automatically clear cache
	await notes.delete([note1]);
	await expect(notes.get({ search: { text: 'updated demo' } })).resolves.toEqual([]);
}, 3000);
