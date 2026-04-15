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
import {
	useVaultSelector,
	useWorkspaceActions,
	useWorkspaceData,
} from '@state/redux/vaults/hooks';
import { selectSnapshotSettings } from '@state/redux/vaults/selectors/vault';
import { selectIsNoteOpened, selectWorkspace } from '@state/redux/vaults/vaults';

export const useNoteActions = () => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();
	const workspaceActions = useWorkspaceActions();

	const { openNote, noteClosed } = useNotesContext();

	const store = useStore<RootState>();

	const notesRegistry = useNotesRegistry();

	const click = useCallback(
		(id: NoteId, { temporary = true }: { temporary?: boolean } = {}) => {
			const workspace = selectWorkspace(workspaceData)(store.getState());
			const isNoteOpened = selectIsNoteOpened(id)(workspace);

			if (isNoteOpened) {
				dispatch(workspaceActions.setActiveNote({ noteId: id }));

				if (!temporary && workspace?.temporaryNoteId === id) {
					dispatch(
						workspaceActions.setTemporaryNote({
							noteId: null,
						}),
					);
				}
			} else {
				notesRegistry.getById([id]).then(([note]) => {
					if (note) openNote(note, { temporary });
				});
			}
		},
		[dispatch, notesRegistry, openNote, store, workspaceActions, workspaceData],
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
