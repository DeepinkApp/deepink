import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import { useVaultDB } from '@features/App/Vault';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/vaults/hooks';
import { selectWorkspaces, workspacesApi } from '@state/redux/vaults/vaults';

export const useWorkspacesList = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);

	const dispatch = useAppDispatch();

	const { vaultId } = useWorkspaceData();

	const db = useVaultDB();

	const workspacesManager = useMemo(() => new WorkspacesController(db), [db]);

	const workspaces = useAppSelector(selectWorkspaces({ vaultId }));

	const update = useCallback(async () => {
		const updatedWorkspaces = await workspacesManager.getList();

		dispatch(
			workspacesApi.updateWorkspacesList({
				vaultId,
				workspaces: updatedWorkspaces,
				newNoteTemplate: t('note.title.defaultTemplate', {
					date: '{date:D MMM YYYY, HH:mm}',
				}),
			}),
		);
	}, [dispatch, vaultId, t, workspacesManager]);

	return { workspaces, update };
};
