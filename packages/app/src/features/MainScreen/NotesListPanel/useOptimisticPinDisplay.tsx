import { useEffect, useState } from 'react';
import { WorkspaceEvents } from '@api/events/workspace';
import { NoteId } from '@core/features/notes';
import { useEventBus } from '@features/App/Workspace/WorkspaceProvider';

import { useNotesData } from './useNotesData';

/**
 * Provides a temporary override for how a note's pin state should be displayed
 *
 * After pinning a note, the list is reordered immediately, while notes data
 * is updated with a delay. This can cause the note to briefly render with a stale pin state.
 */
export const useOptimisticPinDisplay = (notesData: ReturnType<typeof useNotesData>) => {
	const [pinDisplayState, setPinDisplayState] = useState<{
		noteId: NoteId;
		isPinned: boolean;
	} | null>(null);

	const eventBus = useEventBus();
	useEffect(() => {
		return eventBus.listen(WorkspaceEvents.NOTE_UPDATED, ({ noteId, reason }) => {
			if (reason !== 'pin') return;

			const currentNote = notesData.get(noteId);
			if (!currentNote) return;

			setPinDisplayState({
				noteId,
				isPinned: !currentNote.isPinned,
			});
		});
	}, [eventBus, notesData]);

	useEffect(() => {
		if (!pinDisplayState) return;

		// Clear the override once notesData is updated
		const actualPinned = notesData.get(pinDisplayState.noteId)?.isPinned;
		if (actualPinned === pinDisplayState.isPinned) {
			setPinDisplayState(null);
		}
	}, [notesData, pinDisplayState]);

	return pinDisplayState;
};
