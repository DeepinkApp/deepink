import { useCallback, useEffect, useMemo, useState } from 'react';
import { getRandomBytes } from '@core/encryption/utils/random';
import { RootedFS } from '@core/features/files/RootedFS';
import { disposableEncryption, disposableKDF } from '@core/storage/cryptography';
import { VaultConfigController } from '@core/storage/VaultConfigController';
import { VaultController } from '@core/storage/VaultController';
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

			const vaultConfig = new VaultConfigController(
				new RootedFS(files, `/vaults/${summary.id}`),
			);

			const vaultController = new VaultController(
				vaultConfig,
				disposableEncryption,
				disposableKDF,
				getRandomBytes,
			);

			await vaultController.init({
				encryption:
					vault.password === null
						? undefined
						: {
								password: vault.password,
								algorithm: vault.algorithm,
								keyDerivation: { memory: 128, ops: 2 },
							},
			});

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
