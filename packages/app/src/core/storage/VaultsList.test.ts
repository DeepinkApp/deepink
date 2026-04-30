import { webcrypto } from 'node:crypto';

import { createFileManagerMock } from '@core/features/files/__tests__/mocks/createFileManagerMock';

import { VaultsList } from './VaultsList';

vi.stubGlobal('self', {
	crypto: webcrypto,
});

const UUID_PATTERN = /^[\da-f-]{36}$/i;

describe('Vaults management', () => {
	test('Create vaults', async () => {
		const files = createFileManagerMock();
		const vaults = new VaultsList(files);

		await expect(vaults.getAll(), 'No vaults').resolves.toEqual([]);

		// Add few vaults
		await expect(
			vaults.create({
				name: 'foo',
				isEncrypted: false,
			}),
		).resolves.toEqual({
			id: expect.stringMatching(UUID_PATTERN),
			name: 'foo',
			isEncrypted: false,
		});

		await expect(
			vaults.create({
				name: 'bar',
				isEncrypted: false,
			}),
		).resolves.toEqual({
			id: expect.stringMatching(UUID_PATTERN),
			name: 'bar',
			isEncrypted: false,
		});

		await expect(vaults.getAll(), 'All vaults is in list').resolves.toEqual([
			{
				id: expect.stringMatching(UUID_PATTERN),
				name: 'foo',
				isEncrypted: false,
			},
			{
				id: expect.stringMatching(UUID_PATTERN),
				name: 'bar',
				isEncrypted: false,
			},
		]);
	});

	test('Update vault data', async () => {
		const files = createFileManagerMock();
		const vaults = new VaultsList(files);

		await expect(vaults.getAll(), 'No vaults').resolves.toEqual([]);

		// Add few vaults
		const foo = await vaults.create({
			name: 'foo',
			isEncrypted: false,
		});

		const bar = await vaults.create({
			name: 'bar',
			isEncrypted: true,
		});

		await expect(vaults.getAll(), 'All vaults is in list').resolves.toEqual([
			{
				id: expect.stringMatching(UUID_PATTERN),
				name: 'foo',
				isEncrypted: false,
			},
			{
				id: expect.stringMatching(UUID_PATTERN),
				name: 'bar',
				isEncrypted: true,
			},
		]);

		await vaults.update(foo.id, { name: 'updated foo', isEncrypted: true });
		await vaults.update(bar.id, { name: 'updated bar' });

		await expect(vaults.getAll(), 'All vaults is in list').resolves.toEqual([
			{
				id: expect.stringMatching(UUID_PATTERN),
				name: 'updated foo',
				isEncrypted: true,
			},
			{
				id: expect.stringMatching(UUID_PATTERN),
				name: 'updated bar',
				isEncrypted: true,
			},
		]);
	});

	test('Delete vaults', async () => {
		const files = createFileManagerMock();
		const vaults = new VaultsList(files);

		await expect(vaults.getAll(), 'No vaults').resolves.toEqual([]);

		// Add few vaults
		const foo = await vaults.create({
			name: 'foo',
			isEncrypted: false,
		});

		await vaults.create({
			name: 'bar',
			isEncrypted: true,
		});

		const baz = await vaults.create({
			name: 'baz',
			isEncrypted: true,
		});

		await expect(vaults.getAll(), 'All vaults is in list').resolves.toEqual([
			{
				id: expect.stringMatching(UUID_PATTERN),
				name: 'foo',
				isEncrypted: false,
			},
			{
				id: expect.stringMatching(UUID_PATTERN),
				name: 'bar',
				isEncrypted: true,
			},
			{
				id: expect.stringMatching(UUID_PATTERN),
				name: 'baz',
				isEncrypted: true,
			},
		]);

		await vaults.delete([foo.id, baz.id]);
		await expect(vaults.getAll(), 'All vaults is in list').resolves.toEqual([
			{
				id: expect.stringMatching(UUID_PATTERN),
				name: 'bar',
				isEncrypted: true,
			},
		]);
	});
});
