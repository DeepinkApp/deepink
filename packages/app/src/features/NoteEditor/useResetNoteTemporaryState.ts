import { useEffect, useRef } from 'react';
import { NoteId } from '@core/features/notes';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/vaults/hooks';
import { selectTemporaryNoteId, workspacesApi } from '@state/redux/vaults/vaults';

/**
 * Update note to non-temporary when its content is changed
 */
export const useResetNoteTemporaryState = (
	noteId: NoteId,
	text: string,
	title: string,
) => {
	const dispatch = useAppDispatch();
	const temporaryNote = useWorkspaceSelector(selectTemporaryNoteId);
	const workspaceData = useWorkspaceData();

	const isFirstRenderRef = useRef(true);
	useEffect(() => {
		if (isFirstRenderRef.current) {
			isFirstRenderRef.current = false;
			return;
		}

		// Ignore if the current note is not temporary
		if (temporaryNote !== noteId) return;

		dispatch(workspacesApi.unsetPreviewTab({ ...workspaceData }));

		// Effect should only trigger on content change
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [title, text]);
};
