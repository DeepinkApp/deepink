import React, {
	createContext,
	FC,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { isEqual } from 'lodash';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { useDebounce } from 'use-debounce';
import { ManagedDatabase } from '@core/database/ManagedDatabase';
import { SQLiteDB } from '@core/database/sqlite';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import { useVaultShortcutsHandlers } from '@features/App/Vault/useVaultShortcutsHandlers';
import { StatusBarProvider } from '@features/MainScreen/StatusBar/StatusBarProvider';
import { SplashScreen } from '@features/SplashScreen';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useCommandCallback } from '@hooks/commands/useCommandCallback';
import { useShortcutsBinding } from '@hooks/shortcuts/useShortcutsBinding';
import { useImmutableCallback } from '@hooks/useImmutableCallback';
import { useIsDeveloper } from '@hooks/useIsDeveloper';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { selectIsActiveWorkspaceLoaded } from '@state/redux/vaults/selectors/workspaceLoadingStatus';
import {
	createWorkspaceObject,
	defaultVaultConfig,
	selectActiveWorkspaceInfo,
	selectWorkspacesInfo,
	VaultConfigScheme,
	workspacesApi,
} from '@state/redux/vaults/vaults';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { VaultContainer } from '../Vaults/hooks/useVaultContainers';
import { Workspace, WorkspaceContext } from '../Workspace';
import { WorkspaceErrorProvider } from '../Workspace/WorkspaceErrorProvider';
import { WorkspaceErrorScreen } from '../Workspace/WorkspaceErrorScreen';
import { VaultServices } from './services';
import { useVaultState } from './useVaultState';
import { useVaultError } from './VaultErrorProvider';
import { VaultStatusBar } from './VaultStatusBar/VaultStatusBar';

export type VaultControls = {
	vault: VaultContainer;
	close: () => void;
};

export const VaultControlsContext = createContext<VaultControls | null>(null);
export const useVaultControls = createContextGetterHook(VaultControlsContext);

export function useVaultDB(managed: true): ManagedDatabase<SQLiteDB>;
export function useVaultDB(managed: false): SQLiteDB;
export function useVaultDB(): SQLiteDB;
export function useVaultDB(managed = false): SQLiteDB | ManagedDatabase<SQLiteDB> {
	const db = useVaultControls().vault.db;
	return managed ? db : db.get();
}

export type VaultProps = {
	vault: VaultContainer;
	controls: VaultControls;
};

export const Vault: FC<VaultProps> = ({ vault: currentVault, controls }) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);

	const dispatch = useAppDispatch();

	const vaultId = currentVault.vault.id;

	const workspaces = useAppSelector(
		useMemo(() => selectWorkspacesInfo({ vaultId }), [vaultId]),
		isEqual,
	);

	const handleVaultError = useVaultError();

	const getVaultState = useVaultState({
		sync: Object.keys(workspaces).length > 0,
		controls,
	});

	const workspacesManager = useMemo(
		() => new WorkspacesController(currentVault.db.get()),
		[currentVault.db],
	);
	useEffect(() => {
		let isVaultLoadCancelled = false;

		const vaultConfig = new StateFile(
			new FileController('config.json', controls.vault.files),
			VaultConfigScheme,
		);

		Promise.all([workspacesManager.getList(), vaultConfig.get(), getVaultState()])
			.then(async ([workspaces, config, state]) => {
				if (isVaultLoadCancelled) return;
				const [defaultWorkspace] = workspaces;

				if (!defaultWorkspace)
					throw new Error(
						'No workspaces found in vault, at least one is required',
					);

				dispatch(
					workspacesApi.addVault({
						vaultId,
						vault: {
							activeWorkspace: null,
							workspaces: Object.fromEntries(
								workspaces.map((workspace) => [
									workspace.id,
									createWorkspaceObject({
										...workspace,
										newNoteTemplate: t('note.title.defaultTemplate', {
											date: '{date:D MMM YYYY, HH:mm}',
										}),
									}),
								]),
							),
							config: {
								...defaultVaultConfig,
								...config,
							},
						},
					}),
				);
				dispatch(workspacesApi.setActiveVault(vaultId));

				let selectedWorkspace = defaultWorkspace;
				if (state?.activeWorkspace) {
					selectedWorkspace =
						workspaces.find((w) => w.id === state.activeWorkspace) ??
						defaultWorkspace;
				}
				dispatch(
					workspacesApi.setActiveWorkspace({
						vaultId,
						workspaceId: selectedWorkspace.id,
					}),
				);
			})
			.catch((error) => {
				if (isVaultLoadCancelled) return;

				handleVaultError(error);
			});

		return () => {
			isVaultLoadCancelled = true;

			dispatch(
				workspacesApi.removeVault({
					vaultId,
				}),
			);
		};
		// Load vault data only once to initialize the component
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const isDevMode = useIsDeveloper();

	const db = controls.vault.db;
	useEffect(() => {
		if (!isDevMode) return;

		(globalThis as any)[Symbol.for('db')] = db;

		return () => {
			delete (globalThis as any)[Symbol.for('db')];
		};
	}, [db, isDevMode]);

	useShortcutsBinding();
	useVaultShortcutsHandlers();

	useCommandCallback(GLOBAL_COMMANDS.LOCK_CURRENT_VAULT, () => controls.close(), {
		enabled: controls.vault.vault.isEncrypted,
	});
	useCommandCallback(GLOBAL_COMMANDS.SYNC_DATABASE, () => db.sync());

	const [workspaceErrors, setWorkspaceErrors] = useState<Record<string, Error>>({});
	const activeWorkspace = useAppSelector(selectActiveWorkspaceInfo({ vaultId }));
	const activeWorkspaceError = activeWorkspace
		? workspaceErrors[activeWorkspace.id]
		: null;

	const isActiveWorkspaceLoaded = useAppSelector(
		selectIsActiveWorkspaceLoaded({ vaultId }),
	);
	const [isLoadingComplete] = useDebounce(
		isActiveWorkspaceLoaded || activeWorkspaceError,
		500,
		{
			leading: true,
		},
	);

	// Memoize to keep the function stable across renders so it can be used as a dependency in child effects
	const onWorkspaceError = useCallback((error: Error, workspaceId: string) => {
		setWorkspaceErrors((prev) => ({ ...prev, [workspaceId]: error }));
	}, []);
	const onWorkspaceErrorReset = useCallback((workspaceId: string) => {
		setWorkspaceErrors((prev) => {
			const updated = { ...prev };
			delete updated[workspaceId];
			return updated;
		});
	}, []);

	// Debug knobs
	const crashActiveWorkspace = useImmutableCallback(
		(error?: Error) => {
			if (!activeWorkspace) {
				console.warn('No active workspace found');
				return;
			}

			onWorkspaceError(error ?? new Error('Test error'), activeWorkspace?.id);
		},
		[activeWorkspace, onWorkspaceError],
	);

	useEffect(() => {
		(window as any)[Symbol.for('WORKSPACE_CRASH')] = crashActiveWorkspace;
	}, [crashActiveWorkspace]);

	return (
		<VaultControlsContext.Provider value={controls}>
			{!isLoadingComplete && <SplashScreen />}
			{workspaces.length > 0 && <VaultServices />}

			{activeWorkspaceError && (
				<WorkspaceErrorScreen onWorkspaceErrorReset={onWorkspaceErrorReset} />
			)}

			{workspaces.map((workspace) => {
				if (!workspace.touched) return null;
				if (activeWorkspaceError && activeWorkspace?.id === workspace.id)
					return null;

				return (
					<WorkspaceContext.Provider
						key={workspace.id}
						value={{ vaultId, workspaceId: workspace.id }}
					>
						<StatusBarProvider>
							<WorkspaceErrorProvider onError={onWorkspaceError}>
								<Workspace vault={currentVault} />
							</WorkspaceErrorProvider>
							<VaultStatusBar />
						</StatusBarProvider>
					</WorkspaceContext.Provider>
				);
			})}
		</VaultControlsContext.Provider>
	);
};
