import { openSQLite } from '@core/database/sqlite/openSQLite';
import { createWorkspaceId } from '@tests/utils/vaultContext';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { NotesController } from './NotesController';

test('updating a pinned note does not affect the order of pinned notes', async () => {
	const db = await openSQLite(createFileControllerMock());
	onTestFinished(db.close);

	const workspaceId = await createWorkspaceId(db.get());
	const registry = new NotesController(db.get(), workspaceId);

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
	).resolves.toStrictEqual([note3, note1, note2]);

	// Updating note content in a pinned note should not affect the order
	vi.setSystemTime('01/01/2015 12:00');
	await registry.update(note1, { title: '2015', text: 'Dummy text' });

	await expect(
		registry.query({ sort: [{ by: 'pinnedAt', order: 'desc' }] }),
	).resolves.toStrictEqual([note3, note1, note2]);
});

test('updating an unpinned note does not affect the order of pinned notes', async () => {
	const db = await openSQLite(createFileControllerMock());
	onTestFinished(db.close);

	const workspaceId = await createWorkspaceId(db.get());
	const registry = new NotesController(db.get(), workspaceId);

	vi.setSystemTime('01/01/2000 12:00');
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
	).resolves.toStrictEqual([note1, note3, note2]);

	// Update an unpinned note2
	vi.setSystemTime('01/01/2015 12:00');
	await registry.update(note2, { title: '2015', text: 'Dummy text' });

	await expect(
		registry.query({
			sort: [
				{ by: 'pinnedAt', order: 'desc' },
				{ by: 'updatedAt', order: 'desc' },
			],
		}),
	).resolves.toStrictEqual([note1, note2, note3]);
});
