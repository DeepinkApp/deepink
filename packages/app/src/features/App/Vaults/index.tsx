import React, { FC, useEffect, useMemo } from 'react';
import { VaultStorage } from '@features/files';
import { useAppDispatch } from '@state/redux/hooks';
import { workspacesApi } from '@state/redux/vaults/vaults';
import { DisposableBox } from '@utils/disposable';

import { Vault } from '../Vault';
import { VaultControls, VaultControlsContext } from '../Vault/useVaultControls';
import { VaultErrorProvider } from '../Vault/VaultErrorProvider';
import { VaultContainer, VaultsApi } from './hooks/useVaultContainers';

export type VaultsProps = {
	vaultsApi: VaultsApi;
};

const VaultProvider = ({
	vaultContainer,
	vaultsApi,
}: {
	vaultContainer: DisposableBox<VaultContainer>;
	vaultsApi: VaultsApi;
}) => {
	const dispatch = useAppDispatch();

	const vaultContent = vaultContainer.getContent();
	const controls = useMemo(() => {
		return {
			vault: vaultContent,
			close: () => {
				vaultsApi.events.vaultClosed(vaultContainer);

				dispatch(
					workspacesApi.removeVault({
						vaultId: vaultContent.vault.id,
					}),
				);
			},
		} satisfies VaultControls;
	}, [dispatch, vaultContent, vaultContainer, vaultsApi.events]);

	// Close the vault on unmount and clean up all resources
	useEffect(() => {
		return () => controls.close();
	}, [controls]);

	return (
		<VaultControlsContext.Provider value={controls}>
			<VaultErrorProvider controls={controls}>
				<VaultStorage value={vaultContent.files}>
					<Vault vault={vaultContent} controls={controls} />
				</VaultStorage>
			</VaultErrorProvider>
		</VaultControlsContext.Provider>
	);
};

export const Vaults: FC<VaultsProps> = ({ vaultsApi }) => {
	return (
		<>
			{vaultsApi.vaults.map((vaultContainer) => {
				// TODO: hide not active vault, instead of unmount
				if (vaultsApi.activeVault !== vaultContainer) return;

				if (vaultContainer.isDisposed()) return;

				const vaultContent = vaultContainer.getContent();

				return (
					<VaultProvider
						key={vaultContent.vault.id}
						vaultContainer={vaultContainer}
						vaultsApi={vaultsApi}
					/>
				);
			})}
		</>
	);
};
