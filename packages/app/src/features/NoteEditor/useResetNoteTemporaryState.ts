import { useEffect, useRef } from 'react';
import { NoteId } from '@core/features/notes';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceActions, useWorkspaceSelector } from '@state/redux/vaults/hooks';
import { selectIsNoteTemporary } from '@state/redux/vaults/vaults';

export const useResetNoteTemporaryState = (
	noteId: NoteId,
	text: string,
	title: string,
) => {
	const dispatch = useAppDispatch();
	const workspaceAction = useWorkspaceActions();

	// When note content changes, mark it as not temporary
	const isFirstRenderRef = useRef(true);
	const isNoteTemporary = useWorkspaceSelector(selectIsNoteTemporary(noteId));
	useEffect(() => {
		if (isFirstRenderRef.current) {
			isFirstRenderRef.current = false;
			return;
		}

		if (isNoteTemporary) {
			dispatch(
				workspaceAction.setNoteTemporaryState({
					noteId: noteId,
					isTemporary: false,
				}),
			);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [title, text, dispatch, workspaceAction, noteId]);
};
