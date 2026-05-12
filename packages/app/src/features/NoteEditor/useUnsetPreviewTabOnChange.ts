import { useEffect, useRef } from 'react';
import { NoteId } from '@core/features/notes';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/vaults/hooks';
import { selectPreviewTabId, workspacesApi } from '@state/redux/vaults/vaults';

export const useUnsetPreviewTabOnChange = (noteId: NoteId, deps: unknown[]) => {
	const dispatch = useAppDispatch();
	const previewTabId = useWorkspaceSelector(selectPreviewTabId);
	const workspaceData = useWorkspaceData();

	const isFirstRenderRef = useRef(true);
	useEffect(() => {
		if (isFirstRenderRef.current) {
			isFirstRenderRef.current = false;
			return;
		}

		// Ignore if the current note is not preview
		if (previewTabId !== noteId) return;

		dispatch(workspacesApi.unsetPreviewTab({ ...workspaceData }));

		// Effect should only trigger on content change
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);
};
