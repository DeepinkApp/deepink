import { useEffect, useRef } from 'react';
import { NoteId } from '@core/features/notes';
import { useAppDispatch, useAppStore } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceRootSelector } from '@state/redux/vaults/hooks';
import { selectPreviewTabId, workspacesApi } from '@state/redux/vaults/vaults';

// TODO: consider move the hook deeply
/**
 * Hook always toggles a preview tab to a regular tab when deps change:
 *
 * If a tab becomes a preview after being regular and deps change
 * the hook will toggle it back to regular again.
 */
export const useTogglePreviewTabToRegularOnChange = (noteId: NoteId, deps: unknown[]) => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();
	const store = useAppStore();
	const selectWorkspace = useWorkspaceRootSelector();

	const isFirstRenderRef = useRef(true);
	useEffect(() => {
		if (isFirstRenderRef.current) {
			isFirstRenderRef.current = false;
			return;
		}

		// Ignore if the current note is not preview
		const previewTabId = selectPreviewTabId(selectWorkspace(store.getState()));
		if (previewTabId !== noteId) return;

		dispatch(workspacesApi.togglePreviewTabToRegular({ ...workspaceData }));

		// Effect should only trigger on deps change
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [store, ...deps]);
};
