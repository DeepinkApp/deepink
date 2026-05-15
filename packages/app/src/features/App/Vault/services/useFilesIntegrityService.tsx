import { useEffect } from 'react';
import ms from 'ms';
import { AttachmentsController } from '@core/features/attachments/AttachmentsController';
import { FilesController } from '@core/features/files/FilesController';
import { RootedFS } from '@core/features/files/RootedFS';
import { FilesIntegrityController } from '@core/features/integrity/FilesIntegrityController';
import { useVaultStorage } from '@features/files';
import { getWorkspaceFilesPath } from '@features/files/paths';
import { useService } from '@hooks/useService';
import { useVaultSelector } from '@state/redux/vaults/hooks';
import {
	selectIntegrityServiceConfig,
	selectWorkspacesSummary,
} from '@state/redux/vaults/selectors/vault';
import { wait } from '@utils/time';

import { useVaultControls, useVaultDB } from '..';

export const useFilesIntegrityService = () => {
	const {
		vault: {
			vault: { id: vaultId },
			encryptionController,
		},
	} = useVaultControls();
	const db = useVaultDB();
	const workspaces = useVaultSelector(selectWorkspacesSummary);
	const { enabled: isServiceEnabled } = useVaultSelector(selectIntegrityServiceConfig);

	const runService = useService();
	const vaultStorage = useVaultStorage();

	useEffect(() => {
		if (!isServiceEnabled) return;

		return runService(async () => {
			console.debug('Start files integrity service...');
			console.warn(
				"Files integrity service will delete a files that is not mentioned in any note. Note snapshots is not considered as a reference source, so you may lost files that only mentioned in history. If that's undesirable - disable this service in next 5 minutes to prevent data loss.",
			);

			const controls = await Promise.all(
				workspaces.map((workspace) => {
					const filesController = new RootedFS(
						vaultStorage,
						getWorkspaceFilesPath(workspace.id),
					);

					return new FilesIntegrityController(filesController, {
						attachments: new AttachmentsController(db, workspace.id),
						files: new FilesController(db, filesController, workspace.id),
					});
				}),
			);

			const abortController = new AbortController();
			const abortSignal = abortController.signal;

			const workerPromise = new Promise<void>(async (res) => {
				const abortPromise = new Promise<void>((res) =>
					abortSignal.addEventListener('abort', () => res(), { once: true }),
				);

				console.debug('A files integrity service wait 5 minutes before start...');
				await Promise.race([wait(ms('5m')), abortPromise]);
				if (abortSignal.aborted) {
					res();
					return;
				}

				while (true) {
					if (abortSignal.aborted) {
						res();
						return;
					}

					console.debug('Scan vault files by files integrity service...');
					Promise.all(controls.map((control) => control.fixAll()));
					if (abortSignal.aborted) {
						res();
						return;
					}

					await Promise.race([wait(ms('5h')), abortPromise]);
				}
			});

			return async () => {
				console.debug('Stop a files integrity service...');

				// Stop services
				abortController.abort();
				await workerPromise;
			};
		});
	}, [
		isServiceEnabled,
		db,
		encryptionController,
		vaultId,
		runService,
		workspaces,
		vaultStorage,
	]);
};
