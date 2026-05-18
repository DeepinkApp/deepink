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
	selectWorkspace,
	workspacesApi,
} from '@state/redux/vaults/vaults';

export type NoteClickOptions = { preview?: boolean };

export const useNoteActions = () => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();

	const { openNote, noteClosed } = useNotesContext();

	const store = useStore<RootState>();

	const notesRegistry = useNotesRegistry();

	const click = useCallback(
		(noteId: NoteId, { preview }: NoteClickOptions = {}) => {
			// Just open a note and exit if not opened yet
			const workspace = selectWorkspace(workspaceData)(store.getState());
			const isNoteOpened = selectIsNoteOpened(noteId)(workspace);
			if (!isNoteOpened) {
				// TODO: await the promise resolution for race condition scenario
				// When user double click, the code calls twice
				// Currently we will fetch DB twice
				// Instead, write promise into some map, and wait that promise
				// in next click if map has promise
				// TODO: fix potentially possible race condition
				// In case user will call that method for click + click + double click,
				// we will call the action 3 times with `preview` true, true, false.
				// In case promises will be resolved in another order, the note may become opened in preview mode
				notesRegistry.getById([noteId]).then(([note]) => {
					if (note) openNote(note, { preview });
				});

				return;
			}

			// Make note active
			dispatch(workspacesApi.setActiveNote({ ...workspaceData, noteId }));

			// Ensure tab is not temporary opened
			// We should check `false` to toggle state only for explicit values
			// `undefined` means flag is not passed
			if (preview === false) {
				dispatch(
					workspacesApi.togglePreviewTabToRegular({ ...workspaceData, noteId }),
				);
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
