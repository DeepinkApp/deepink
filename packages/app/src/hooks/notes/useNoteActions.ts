import { useCallback } from 'react';
import { useStore } from 'react-redux';
import { WorkspaceEvents } from '@api/events/workspace';
import { NoteId } from '@core/features/notes';
import {
	useEventBus,
	useNotesContext,
	useNotesHistory,
	useNotesRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { useAppDispatch } from '@state/redux/hooks';
import { RootState } from '@state/redux/store';
import { useVaultSelector, useWorkspaceData } from '@state/redux/vaults/hooks';
import { selectSnapshotSettings } from '@state/redux/vaults/selectors/vault';
import {
	selectIsNoteOpened,
	selectPreviewTabId,
	selectWorkspace,
	workspacesApi,
} from '@state/redux/vaults/vaults';

export const useNoteActions = () => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();

	const { openNote, noteClosed } = useNotesContext();

	const store = useStore<RootState>();

	const notesRegistry = useNotesRegistry();

	const click = useCallback(
		(id: NoteId, { preview }: { preview?: boolean } = {}) => {
			const workspace = selectWorkspace(workspaceData)(store.getState());
			const isNoteOpened = selectIsNoteOpened(id)(workspace);
			const previewTabId = selectPreviewTabId(workspace);

			if (isNoteOpened) {
				dispatch(workspacesApi.setActiveNote({ ...workspaceData, noteId: id }));

				if (preview === false && previewTabId === id) {
					dispatch(workspacesApi.convertPreviewToRegular({ ...workspaceData }));
				}
			} else {
				notesRegistry.getById([id]).then(([note]) => {
					if (note) openNote(note, { preview });
				});
			}
		},
		[dispatch, notesRegistry, openNote, store, workspaceData],
	);

	const eventBus = useEventBus();
	const noteHistory = useNotesHistory();
	const { enabled: isSnapshotsEnabled } = useVaultSelector(selectSnapshotSettings);
	const close = useCallback(
		async (id: NoteId) => {
			noteClosed(id);

			if (!isSnapshotsEnabled) return;

			// Take note content snapshot (if not disabled)
			const [note] = await notesRegistry.getById([id]);
			if (note && !note.isSnapshotsDisabled) {
				noteHistory.snapshot(id).then(() => {
					eventBus.emit(WorkspaceEvents.NOTE_HISTORY_UPDATED, id);
				});
			}
		},
		[eventBus, isSnapshotsEnabled, noteClosed, noteHistory, notesRegistry],
	);

	return { click, close };
};
