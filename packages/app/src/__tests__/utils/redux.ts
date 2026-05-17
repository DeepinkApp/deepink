import { INote } from '@core/features/notes';
import { configureStore } from '@reduxjs/toolkit';

import { defaultSettings, settingsSlice } from '../../state/redux/settings/settings';
import { RootState } from '../../state/redux/store';
import { selectWorkspaceRootSafe } from '../../state/redux/vaults/utils';
import {
	createWorkspaceObject,
	defaultVaultConfig,
	selectWorkspace,
	vaultsSlice,
} from '../../state/redux/vaults/vaults';

export const mockNoteObject = (id: string) => ({ id }) as unknown as INote;

export function createTestStore() {
	const TEST_VAULT_NAME = 'test-vault-1';
	const TEST_WORKSPACE_NAME = 'test-workspace-1';
	const workspaceScope = {
		vaultId: TEST_VAULT_NAME,
		workspaceId: TEST_WORKSPACE_NAME,
	};

	const store = configureStore({
		reducer: {
			settings: settingsSlice.reducer,
			vaults: vaultsSlice.reducer,
		},
		preloadedState: {
			settings: defaultSettings,
			vaults: {
				activeVault: TEST_VAULT_NAME,
				vaults: {
					[TEST_VAULT_NAME]: {
						activeWorkspace: TEST_WORKSPACE_NAME,
						workspaces: {
							[TEST_WORKSPACE_NAME]: createWorkspaceObject({
								id: TEST_WORKSPACE_NAME,
								name: TEST_WORKSPACE_NAME,
								newNoteTemplate: '',
							}),
						},
						config: defaultVaultConfig,
					},
				},
			},
		} satisfies RootState,
	});

	return {
		store,
		workspaceScope,
		selectors: {
			workspace: () =>
				selectWorkspaceRootSafe(
					selectWorkspace(workspaceScope)(store.getState()),
				),
		},
	};
}
