import { useEffect } from 'react';
import { WorkspaceEvents } from '@api/events/workspace';
import { INote, NoteId } from '@core/features/notes';
import { useEventBus, useNotesRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { useDeepEqualValue } from '@hooks/useDeepEqualValue';
import { useDebouncedCallback } from '@utils/debounce/useDebouncedCallback';
import { joinCallbacks } from '@utils/react/joinCallbacks';

import { useEvictingMap } from './useEvictingMap';

/**
 * Loads and return data for provided note ids
 */
export const useNotesData = ({ noteIds }: { noteIds: NoteId[] }) => {
	const memoizedNoteIds = useDeepEqualValue(() => noteIds);

	// Load notes
	const notesData = useEvictingMap<INote>();
	const notesRegistry = useNotesRegistry();
	const loadNotesData = useDebouncedCallback(
		() => {
			notesRegistry.getById(memoizedNoteIds).then((loadedNotes) => {
				if (loadedNotes.length === 0) return;

				notesData.add(
					loadedNotes.map((note) => [note.id, note] as [string, INote]),
				);
			});
		},
		{ wait: 120, runImmediateFirstCall: true },
	);

	// Fetch notes data
	useEffect(() => {
		if (memoizedNoteIds.length === 0) {
			// Reset timeouts for debounced function and cancel last call if scheduled
			loadNotesData.cancel();
		} else {
			loadNotesData();
		}
	}, [memoizedNoteIds, loadNotesData]);

	// Re-fetch note data by changes
	const eventBus = useEventBus();
	useEffect(() => {
		const onNoteUpdated = (noteId: NoteId) => {
			if (notesData.has(noteId)) {
				loadNotesData();
			}
		};

		return joinCallbacks(
			eventBus.listen(WorkspaceEvents.NOTE_UPDATED, ({ noteId }) =>
				onNoteUpdated(noteId),
			),
			eventBus.listen(WorkspaceEvents.NOTE_EDITED, onNoteUpdated),
		);
	}, [eventBus, loadNotesData, notesData]);

	return notesData;
};
