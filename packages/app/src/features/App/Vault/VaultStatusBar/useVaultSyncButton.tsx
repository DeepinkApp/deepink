import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaHardDrive } from 'react-icons/fa6';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { useDebounce } from 'use-debounce';
import { Box } from '@chakra-ui/react';
import { useStatusBarManager } from '@features/MainScreen/StatusBar/StatusBarProvider';

import { useVaultControls } from '..';

import styles from './VaultStatusBar.module.css';

export const useVaultSyncButton = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);
	const { controls } = useStatusBarManager();

	const {
		vault: { db },
	} = useVaultControls();

	const [isPending, setIsPending] = useDebounce(false, 900);
	useEffect(() => {
		return db.onSync((status) => {
			if (status === 'pending') {
				setIsPending(true);
				setIsPending.flush();
			} else {
				setIsPending(false);
			}
		});
	}, [db, setIsPending]);

	useEffect(() => {
		controls.update(
			'sync',
			{
				visible: true,
				title: t('statusBar.sync.title'),
				text: isPending ? t('statusBar.sync.saving') : undefined,
				icon: (
					<Box
						css={{
							scale: 0.9,
							animation: isPending
								? `${styles.blink} 900ms linear infinite`
								: undefined,
						}}
					>
						<FaHardDrive />
					</Box>
				),
				onClick: () => {
					db.sync();
				},
			},
			{
				placement: 'start',
				priority: 100000,
			},
		);
	}, [controls, db, isPending, t]);
};
