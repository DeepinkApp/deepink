import React, { useEffect, useRef } from 'react';
import { WorkspaceEvents } from '@api/events/workspace';
import { NoteId } from '@core/features/notes';
import { useEventBus } from '@features/App/Workspace/WorkspaceProvider';
import { useImmutableCallback } from '@hooks/useImmutableCallback';
import { useWorkspaceSelector } from '@state/redux/vaults/hooks';
import { selectNotesView } from '@state/redux/vaults/selectors/view';
import { selectActiveTag, selectSearch } from '@state/redux/vaults/vaults';
import { Virtualizer } from '@tanstack/react-virtual';
import { isElementInViewport } from '@utils/dom/isElementInViewport';
import { joinCallbacks } from '@utils/react/joinCallbacks';

import { scrollAlignment } from './NotesList';

const useOnFiltersChange = (callback: () => void) => {
	const notesView = useWorkspaceSelector(selectNotesView);
	const activeTag = useWorkspaceSelector(selectActiveTag);
	const search = useWorkspaceSelector(selectSearch);

	const userCallback = useImmutableCallback(() => callback(), [callback]);

	useEffect(() => {
		userCallback();
	}, [notesView, activeTag?.id, search, userCallback]);
};

export const useScrollToActiveNote = ({
	virtualizer,
	noteIds,
	activeNoteId,
	activeNoteRef,
}: {
	virtualizer: Virtualizer<any, any>;
	noteIds: NoteId[];
	activeNoteId: NoteId | null;
	activeNoteRef: React.RefObject<HTMLDivElement | null>;
}) => {
	// Reset the scroll once filters changed
	useOnFiltersChange(() => {
		virtualizer.scrollToOffset(0);
	});

	const isScrollFixNeededRef = useRef(false);
	const scrollToActiveNote = useImmutableCallback(() => {
		if (!activeNoteId) return;

		const noteIndex = noteIds.indexOf(activeNoteId);
		if (noteIndex === -1) return;

		// Skip if active note is in viewport
		if (activeNoteRef.current && isElementInViewport(activeNoteRef.current)) return;

		isScrollFixNeededRef.current = true;
		virtualizer.scrollToIndex(noteIndex, {
			align: scrollAlignment,
		});
	}, [activeNoteId, activeNoteRef, noteIds, virtualizer]);

	useEffect(() => {
		scrollToActiveNote();

		// We need to focus note only when active note have been changed
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeNoteId]);

	// Edge case fix. When we scroll to the last note, its content is a bit over scroll.
	// The cause is difficult to debug, but the point is a notes after loading takes a space.
	// Here we wait a note will be loaded after scroll, and assume that all other notes,
	// will be loaded too, so last note will be shifted. Then we scroll to note again.
	// We no need deps array here, since we have early return guards
	useEffect(() => {
		if (!isScrollFixNeededRef.current) return;
		if (!activeNoteId || !activeNoteRef.current) return;

		const isLoading = activeNoteRef.current.dataset.loading !== undefined;
		if (isLoading) return;

		isScrollFixNeededRef.current = false;

		const index = noteIds.indexOf(activeNoteId);
		if (index === -1) return;

		virtualizer.scrollToIndex(index, {
			align: scrollAlignment,
		});
	});

	// Focus active note by changes in case it was in viewport
	const wasActiveNoteInViewport = useRef(false);
	const eventBus = useEventBus();
	useEffect(() => {
		if (activeNoteId === null) return;

		const onNoteUpdated = (noteId: NoteId) => {
			if (noteId !== activeNoteId) return;
			wasActiveNoteInViewport.current =
				activeNoteRef.current !== null &&
				isElementInViewport(activeNoteRef.current);
		};

		return joinCallbacks(
			eventBus.listen(WorkspaceEvents.NOTE_UPDATED, onNoteUpdated),
			eventBus.listen(WorkspaceEvents.NOTE_EDITED, onNoteUpdated),
		);
	}, [activeNoteId, activeNoteRef, eventBus]);

	useEffect(() => {
		if (activeNoteId === null) return;

		if (!wasActiveNoteInViewport.current) return;

		const isActiveNoteInViewport =
			activeNoteRef.current !== null && isElementInViewport(activeNoteRef.current);
		if (isActiveNoteInViewport) return;

		wasActiveNoteInViewport.current = false;
		scrollToActiveNote();
	});
};
