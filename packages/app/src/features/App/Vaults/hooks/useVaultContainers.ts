import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUnit } from 'effector-react';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { ManagedDatabase } from '@core/database/ManagedDatabase';
import { SQLiteDB } from '@core/database/sqlite';
import { openSQLite } from '@core/database/sqlite/openSQLite';
import { EncryptionController } from '@core/encryption/EncryptionController';
import { PlaceholderEncryptionController } from '@core/encryption/PlaceholderEncryptionController';
import { getRandomBytes } from '@core/encryption/utils/random';
import { IFilesStorage } from '@core/features/files';
import { EncryptedFS } from '@core/features/files/EncryptedFS';
import { FileController } from '@core/features/files/FileController';
import { RootedFS } from '@core/features/files/RootedFS';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import { disposableEncryption, disposableKDF } from '@core/storage/cryptography';
import { VaultEncryptionConfig } from '@core/storage/VaultConfigController';
import {
	VaultEncryptionController,
	VaultOpenError,
	VaultOpenErrorCode,
} from '@core/storage/VaultEncryptionController';
import { VaultSummary } from '@core/storage/VaultsList';
import { useFilesStorage } from '@features/files';
import { DisposableBox } from '@utils/disposable';

import { createVaultsApi, VaultEntry } from './vaults';

export type VaultContainer = {
	vault: VaultEntry;
	db: ManagedDatabase<SQLiteDB>;
	encryptionController: EncryptionController;
	files: IFilesStorage;
};

// TODO: cover with tests to ensure we can decrypt exists vault
/**
 * Hook to manage active and opened vaults
 */
export const useVaultContainers = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);

	const [{ $vaults, $activeVault, ...api }] = useState(() =>
		createVaultsApi<DisposableBox<VaultContainer>>(),
	);

	const vaults = useUnit($vaults);
	const activeVault = useUnit($activeVault);

	const files = useFilesStorage();

	const { vaultOpened, activeVaultChanged } = api.events;
	const openVault = useCallback(
		async (
			{ vault, password }: { vault: VaultSummary; password?: string },
			changeActiveVault = false,
		) => {
			const cleanups: (() => void)[] = [];

			const runCleanups = async () => {
				// TODO: remove key of RAM. Set control with callback to remove key
				// LIFO cleanup: last added cleanup runs first
				for (const cleanup of [...cleanups].reverse()) {
					try {
						// TODO: set deadline for awaiting
						await cleanup();
					} catch (error) {
						console.error(error);
					}
				}
			};

			try {
				const vaultFilesController = new RootedFS(files, `/vaults/${vault.id}`);

				// Setup encryption
				let encryptionController: EncryptionController;

				if (!vault.isEncrypted) {
					encryptionController = new EncryptionController(
						new PlaceholderEncryptionController(),
					);
				} else {
					if (password === undefined)
						throw new VaultOpenError(
							VaultOpenErrorCode.INCORRECT_PASSWORD,
							'Empty password for encrypted vault',
						);

					const vaultController = new VaultEncryptionController(
						new VaultEncryptionConfig(vaultFilesController),
						disposableEncryption,
						disposableKDF,
						getRandomBytes,
					);

					const encryption = await vaultController.getEncryption(password);

					cleanups.push(() => encryption.dispose());
					encryptionController = new EncryptionController(
						encryption.getContent(),
					);
				}

				const encryptedVaultFS = new EncryptedFS(
					vaultFilesController,
					encryptionController,
				);

				// Setup DB
				const db = await openSQLite(
					new FileController('vault.db', encryptedVaultFS),
				);

				cleanups.push(() => db.close());

				// Ensure at least one workspace exists
				const workspaces = new WorkspacesController(db.get());
				const isWorkspacesExists = await workspaces
					.getList()
					.then((workspaces) => workspaces.length > 0);
				if (!isWorkspacesExists) {
					await workspaces.create({ name: t('workspace.defaultName') });

					// Sync to avoid losing the default workspace if the app closes before the automatic sync
					await db.sync();
				}

				const vaultEntry: VaultEntry = vault;

				const newVault = new DisposableBox(
					{
						db,
						vault: vaultEntry,
						encryptionController,
						files: encryptedVaultFS,
					} satisfies VaultContainer,
					runCleanups,
				);

				vaultOpened(newVault);

				if (changeActiveVault) {
					activeVaultChanged(newVault);
				}

				return newVault;
			} catch (error) {
				// Close all resources if opening the vault fails
				await runCleanups();

				throw error;
			}
		},
		[activeVaultChanged, files, vaultOpened, t],
	);

	return {
		activeVault,
		vaults,
		...api,
		openVault,
	};
};

export type VaultsApi = ReturnType<typeof useVaultContainers>;
