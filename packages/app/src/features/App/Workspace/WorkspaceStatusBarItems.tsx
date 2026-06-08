import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTent } from 'react-icons/fa6';
import { useDispatch } from 'react-redux';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { useStatusBarManager } from '@features/MainScreen/StatusBar/StatusBarProvider';
import { workspacesApi } from '@state/redux/vaults/vaults';

import { useVaultControls } from '../Vault';
import { useActiveNoteHistoryButton } from './useActiveNoteHistoryButton';

export const WorkspaceStatusBarItems = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);
	const statusBarButtons = useStatusBarManager();
	const dispatch = useDispatch();

	// Vault controls on status bar
	const vaultControls = useVaultControls();
	useEffect(() => {
		statusBarButtons.controls.register(
			'changeVault',
			{
				visible: true,
				title: t('statusBar.changeVault'),
				onClick: () => {
					dispatch(workspacesApi.setActiveVault(null));
					vaultControls.close();
				},
				icon: <FaTent />,
			},
			{
				placement: 'start',
				priority: 1,
			},
		);
	}, [dispatch, statusBarButtons.controls, t, vaultControls]);

	useActiveNoteHistoryButton();

	return null;
};
