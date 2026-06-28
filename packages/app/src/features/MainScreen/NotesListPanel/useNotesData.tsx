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
				// Update the note immediately, otherwise it may temporarily display stale data
				// e.g. after unpinning, the note moves but still shows the pinned icon
				// until the cache is updated and it is re-rendered with the correct state
				notesRegistry.getById([noteId]).then((loadedNote) => {
					const note = loadedNote[0];
					if (!note) return;
					notesData.add([[note.id, note]]);
				});

				loadNotesData();
			}
		};

		return joinCallbacks(
			eventBus.listen(WorkspaceEvents.NOTE_UPDATED, onNoteUpdated),
			eventBus.listen(WorkspaceEvents.NOTE_EDITED, onNoteUpdated),
		);
	}, [eventBus, loadNotesData, notesData, notesRegistry]);

	return notesData;
};
