import { useEffect } from 'react';
import ms from 'ms';
import { DeletedNotesController } from '@core/features/notes/bin/DeletedNotesController';
import { NotesController } from '@core/features/notes/controller/NotesController';
import { useService } from '@hooks/useService';
import { useVaultSelector } from '@state/redux/vaults/hooks';
import {
	selectBinRetentionPolicy,
	selectWorkspacesSummary,
} from '@state/redux/vaults/selectors/vault';

import { useVaultDB } from '..';

export const useBinService = () => {
	const db = useVaultDB();
	const workspaces = useVaultSelector(selectWorkspacesSummary);
	const { autoClean, cleanIntervalInMs } = useVaultSelector(selectBinRetentionPolicy);

	const runService = useService();

	useEffect(() => {
		if (!autoClean) return;

		return runService(async () => {
			console.debug('Start a new bin auto deletion service...');

			const controls = await Promise.all(
				workspaces.map((workspace) => {
					const notes = new NotesController(db, workspace.id);
					const bin = new DeletedNotesController(
						{ notes },
						{ retentionTime: cleanIntervalInMs },
					);

					return bin.startService({
						onClean(count) {
							if (count === 0) return;

							console.warn(
								`${count} notes were permanently deleted from a workspace "${workspace.name}" due to expired retention policy ${ms(cleanIntervalInMs)}`,
							);
						},
					});
				}),
			);

			return async () => {
				console.debug('Stop a bin auto deletion service...');

				// Stop services
				await Promise.all(controls.map((stop) => stop()));
			};
		});
	}, [db, autoClean, cleanIntervalInMs, workspaces, runService]);
};
