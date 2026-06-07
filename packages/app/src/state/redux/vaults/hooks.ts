import { useCallback, useMemo } from 'react';
import { isEqual } from 'lodash';
import { useVaultControls } from '@features/App/Vault';
import { useWorkspaceContext } from '@features/App/Workspace';
import { ActionCreatorWithPayload, Selector } from '@reduxjs/toolkit';

import { useAppSelector, useAppStore } from '../hooks';
import { RootState } from '../store';
import {
	selectVaultById,
	selectWorkspace,
	VaultData,
	WorkspaceData,
	workspacesApi,
} from './vaults';

export const useWorkspaceData = () => {
	const { vaultId, workspaceId } = useWorkspaceContext();
	return { vaultId, workspaceId };
};

// Select vault and workspace from context
export const useWorkspaceRootSelector = () => {
	const { vaultId, workspaceId } = useWorkspaceData();

	return useMemo(
		() => selectWorkspace({ vaultId, workspaceId }),
		[vaultId, workspaceId],
	);
};

export const useWorkspaceSelector = <T>(
	selector: Selector<WorkspaceData | null, T>,
): T => {
	const selectWorkspace = useWorkspaceRootSelector();
	return useAppSelector((state) => selector(selectWorkspace(state)), isEqual);
};

export const useNonReactiveSelector = () => {
	const { vaultId, workspaceId } = useWorkspaceData();

	const store = useAppStore();

	const workspace = useCallback(
		<T>(selector: Selector<WorkspaceData | null, T>): T => {
			const workspaceState = selectWorkspace({ vaultId, workspaceId })(
				store.getState(),
			);
			return selector(workspaceState);
		},
		[store, vaultId, workspaceId],
	);

	const vault = useCallback(
		<T>(selector: Selector<VaultData | null, T>): T => {
			const workspaceState = selectVaultById({ vaultId })(store.getState());
			return selector(workspaceState);
		},
		[store, vaultId],
	);

	return { vault, workspace };
};

export const useVaultSelector = <T>(selector: Selector<VaultData | null, T>): T => {
	const {
		vault: {
			vault: { id: vaultId },
		},
	} = useVaultControls();

	const composedSelector = useCallback(
		(state: RootState) => {
			const selectConfiguredVault = selectVaultById({ vaultId });
			const vault = selectConfiguredVault(state);
			return selector(vault);
		},
		[vaultId, selector],
	);

	return useAppSelector(composedSelector, isEqual);
};

type StripPropsInActionCreator<T, StripPropsSignature extends {}> = {
	[K in keyof T as T[K] extends ActionCreatorWithPayload<
		StripPropsSignature & infer _P,
		infer _
	>
		? K
		: never]: T[K] extends ActionCreatorWithPayload<
		StripPropsSignature & infer P,
		infer N
	>
		? ActionCreatorWithPayload<Omit<P, keyof StripPropsSignature>, N>
		: never;
};

export const useVaultActions = () => {
	const {
		vault: {
			vault: { id: vaultId },
		},
	} = useVaultControls();

	return useMemo(() => {
		return Object.fromEntries(
			Object.entries(workspacesApi).map(([key, action]) => [
				key,
				(props: Record<any, any>) => action({ vaultId, ...props } as any),
			]),
		) as unknown as StripPropsInActionCreator<
			typeof workspacesApi,
			{ vaultId: string }
		>;
	}, [vaultId]);
};

export const useWorkspaceActions = () => {
	const workspaceData = useWorkspaceData();

	return useMemo(() => {
		return Object.fromEntries(
			Object.entries(workspacesApi).map(([key, action]) => [
				key,
				(props: Record<any, any>) =>
					action({ ...props, ...workspaceData } as any),
			]),
		) as unknown as StripPropsInActionCreator<
			typeof workspacesApi,
			{
				vaultId: string;
				workspaceId: string;
			}
		>;
	}, [workspaceData]);
};
