import { useCallback, useEffect, useMemo, useState } from 'react';
import { getRandomBytes } from '@core/encryption/utils/random';
import { RootedFS } from '@core/features/files/RootedFS';
import { disposableEncryption, disposableKDF } from '@core/storage/cryptography';
import { VaultEncryptionConfig } from '@core/storage/VaultConfigController';
import { VaultEncryptionController } from '@core/storage/VaultEncryptionController';
import { VaultsList, VaultSummary } from '@core/storage/VaultsList';
import { useFilesStorage } from '@features/files';

import { NewVault } from './VaultCreator';

export type VaultsListApi = {
	isVaultsLoaded: boolean;
	vaults: VaultSummary[];
	createVault: (vault: NewVault) => Promise<VaultSummary>;
};

/**
 * Hook to manage vault accounts
 */
export const useVaultsList = (): VaultsListApi => {
	const files = useFilesStorage();
	const vaultsList = useMemo(() => new VaultsList(files), [files]);

	const [vaults, setVaults] = useState<VaultSummary[]>([]);
	const [isVaultsLoaded, setIsVaultsLoaded] = useState(false);

	const updateVaults = useCallback(
		() =>
			vaultsList.getAll().then((vaults) => {
				setVaults(vaults);
				setIsVaultsLoaded(true);
			}),
		[vaultsList],
	);

	// Init state
	useEffect(() => {
		updateVaults();
	}, [updateVaults]);

	const createVault = useCallback(
		async (vault: NewVault) => {
			const summary = await vaultsList.create({
				name: vault.name,
				isEncrypted: vault.password !== null,
			});

			// Setup encryption
			if (vault.password) {
				const vaultConfig = new VaultEncryptionConfig(
					new RootedFS(files, `/vaults/${summary.id}`),
				);

				const vaultController = new VaultEncryptionController(
					vaultConfig,
					disposableEncryption,
					disposableKDF,
					getRandomBytes,
				);

				await vaultController.init({
					password: vault.password,
					algorithm: vault.algorithm,
					keyDerivation: { memory: 128, ops: 2 },
				});
			}

			await updateVaults();

			return summary;
		},
		[vaultsList, files, updateVaults],
	);

	return {
		isVaultsLoaded,
		vaults,
		createVault,
	};
};
