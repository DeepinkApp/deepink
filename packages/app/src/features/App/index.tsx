import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { useDebounce } from 'use-debounce';
import { useToast } from '@chakra-ui/react';
import { ConfigStorage } from '@core/storage/ConfigStorage';
import { useFilesStorage } from '@features/files';
import { SplashScreen } from '@features/SplashScreen';
import { getRandomItem } from '@utils/collections/getRandomItem';

import { CenterBox } from './CenterBox';
import { ChooseVaultScreen } from './ChooseVaultScreen';
import { OnPickVault } from './types';
import { useActiveVaultId } from './useActiveVaultId';
import { useRecentVault } from './useRecentVault';
import { useVaultsList } from './useVaultsList';
import { VaultCreator } from './VaultCreator';
import { VaultLoginForm } from './VaultLoginForm';
import {
	useVaultContainers,
	VaultOpenError,
	VaultOpenErrorCode,
} from './Vaults/hooks/useVaultContainers';
import { VaultScreen } from './VaultScreen';
import { WelcomeScreen } from './WelcomeScreen';

export const App: FC = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.vault);

	const files = useFilesStorage();
	const config = useMemo(() => new ConfigStorage('config.json', files), [files]);

	const vaultsList = useVaultsList();
	const vaultContainers = useVaultContainers();

	const [currentVaultId, setCurrentVaultId] = useActiveVaultId(config);
	const currentVault = useMemo(
		() => vaultsList.vaults.find((v) => v.id === currentVaultId) ?? null,
		[currentVaultId, vaultsList.vaults],
	);

	// When the active vault changes, close any open error toast
	const toast = useToast();
	useEffect(() => {
		toast.closeAll();
	}, [currentVaultId, toast]);

	const [screenName, setScreenName] = useState<'create' | 'choose' | 'loading'>(
		'choose',
	);
	const onOpenVault: OnPickVault = useCallback(
		async (vault, password) => {
			setScreenName('loading');

			try {
				if (vault.isEncrypted !== null && password === undefined) {
					return {
						status: 'error',
						message: t('login.errors.passwordRequired'),
					};
				}

				await vaultContainers.openVault({ vault, password }, true);
				return { status: 'ok' };
			} catch (err) {
				// Only unexpected errors show a toast — wrong password is handled by the form
				if (
					err instanceof VaultOpenError &&
					err.code === VaultOpenErrorCode.INCORRECT_PASSWORD
				) {
					return {
						status: 'error',
						message: t('login.errors.invalidPassword'),
					};
				}

				toast({
					status: 'error',
					title: t('errors.failedToOpen'),
					description: t('errors.corrupted', { name: vault.name }),
					containerStyle: { maxW: '400px' },
				});

				throw err;
			} finally {
				setScreenName('choose');
			}
		},
		[vaultContainers, t, toast],
	);

	// Restore and auto-open recent vault
	const recentVault = useRecentVault(config);
	useEffect(
		() => {
			if (!vaultsList.isVaultsLoaded || !recentVault.isLoaded) return;

			// Restore vault id
			setCurrentVaultId(recentVault.vaultId);

			const vault = vaultsList.vaults.find(
				(vault) => vault.id === recentVault.vaultId,
			);

			if (!vault || vault.isEncrypted) return;

			// Automatically open vault with no encryption
			onOpenVault(vault);
		},
		// Depends only of loading status and run only once
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[vaultsList.isVaultsLoaded, recentVault.isLoaded],
	);

	const [isInitialLoading] = useDebounce(
		!vaultsList.isVaultsLoaded || !recentVault.isLoaded,
		500,
	);

	// Skip splash while encrypted vault is opening
	const isVaultLoading = screenName === 'loading' && !currentVault?.isEncrypted;

	const isEmptyVaultsList = vaultsList.vaults.length === 0;
	const [isConfigured, setIsConfigured] = useState(false);

	if (isInitialLoading || isVaultLoading) {
		return <SplashScreen />;
	}

	if (isEmptyVaultsList && !isConfigured)
		return (
			<WelcomeScreen
				onConfirm={() => {
					setIsConfigured(true);
				}}
			/>
		);

	if (vaultContainers.activeVault) {
		return <VaultScreen vaultContainers={vaultContainers} />;
	}

	if (currentVault && currentVault.isEncrypted) {
		return (
			<CenterBox>
				<VaultLoginForm
					vault={currentVault}
					onLogin={onOpenVault}
					onPickAnotherVault={() => setCurrentVaultId(null)}
				/>
			</CenterBox>
		);
	}

	if (screenName === 'create' || isEmptyVaultsList) {
		return (
			<CenterBox>
				<VaultCreator
					onCreateVault={async (vault) => {
						const newVault = await vaultsList.createVault(vault);
						await onOpenVault(newVault, vault.password || undefined);
					}}
					onCancel={
						isEmptyVaultsList ? undefined : () => setScreenName('choose')
					}
					defaultVaultName={getRandomItem(
						Object.values(
							t('creator.field.name.suggests', {
								returnObjects: true,
							}),
						) as string[],
					)}
				/>
			</CenterBox>
		);
	}

	return (
		<ChooseVaultScreen
			vaults={vaultsList.vaults}
			onOpenVault={onOpenVault}
			onCreateVault={() => setScreenName('create')}
		/>
	);
};
