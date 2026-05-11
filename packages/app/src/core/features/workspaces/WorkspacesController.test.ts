import { makeAutoClosedSQLiteDB } from 'src/__tests__/utils/makeAutoClosedSQLiteDB';

import { WorkspacesController } from './WorkspacesController';

const { getDB } = makeAutoClosedSQLiteDB();

test('basic usage', async () => {
	const db = await getDB();

	const workspaces = new WorkspacesController(db.get());

	// Create
	const workspacesIds = await Promise.all([
		workspaces.create({ name: 'Workspace name' }),
		workspaces.create({ name: 'Workspace name' }),
	]);

	// Get one
	await expect(workspaces.get(workspacesIds[0])).resolves.toEqual({
		id: workspacesIds[0],
		name: 'Workspace name',
	});

	// Get list
	await expect(workspaces.getList()).resolves.toEqual(
		expect.arrayContaining(
			workspacesIds.map((id) =>
				expect.objectContaining({ id, name: 'Workspace name' }),
			),
		),
	);

	// Delete
	await expect(workspaces.delete([workspacesIds[0]])).resolves.toBeUndefined();
	await expect(workspaces.get(workspacesIds[0])).resolves.toBeNull();
	await expect(workspaces.getList()).resolves.toEqual(
		expect.arrayContaining([
			expect.objectContaining({ id: workspacesIds[1], name: 'Workspace name' }),
		]),
	);
});

test('update workspace', async () => {
	const db = await getDB();

	const workspaces = new WorkspacesController(db.get());

	const id = await workspaces.create({ name: 'Workspace name' });
	await expect(workspaces.get(id)).resolves.toEqual({
		id,
		name: 'Workspace name',
	});

	await workspaces.update(id, { name: 'Updated name' });
	await expect(workspaces.get(id)).resolves.toEqual({
		id,
		name: 'Updated name',
	});
});
