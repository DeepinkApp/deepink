import z from 'zod';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';

import { IFilesStorage } from '../features/files';

export const VaultSummaryScheme = z.object({
	id: z.string(),
	name: z.string(),
	isEncrypted: z.boolean().optional().default(false),
});

export type VaultSummary = z.output<typeof VaultSummaryScheme>;

export class VaultsList {
	private readonly state;
	constructor(files: IFilesStorage) {
		this.state = new StateFile(
			new FileController('vaults.json', files),
			VaultSummaryScheme.array(),
			{ defaultValue: [] },
		);
	}

	public async getAll(): Promise<VaultSummary[]> {
		return this.state.get();
	}

	public async get(id: string): Promise<VaultSummary | null> {
		const vaults = await this.getAll();
		return vaults.find((vault) => vault.id === id) ?? null;
	}

	public async create(info: Omit<VaultSummary, 'id'>): Promise<VaultSummary> {
		const vaults = await this.state.get();

		// Ensure unique id
		let vaultId;
		const ids = new Set(vaults.map((vault) => vault.id));
		while (true) {
			// The crypto random is not necessary,
			// we just want to make it as unique as possible
			vaultId = self.crypto.randomUUID();
			if (!ids.has(vaultId)) break;
		}

		const newVault: VaultSummary = {
			...info,
			id: vaultId,
		};

		await this.state.set([...vaults, newVault]);

		return newVault;
	}

	public async delete(ids: VaultSummary['id'][]): Promise<void> {
		const idsToRemove = new Set(ids);
		const vaults = await this.state.get();
		await this.state.set(vaults.filter((vault) => !idsToRemove.has(vault.id)));
	}

	public async update(
		id: VaultSummary['id'],
		changes: Partial<Omit<VaultSummary, 'id'>>,
	): Promise<void> {
		const vaults = await this.state.get();
		const vault = vaults.find((vault) => vault.id === id);
		if (!vault) throw new Error(`Vault with id "${id}" is not found`);

		Object.assign(vault, changes);
		await this.state.set(vaults);
	}
}
