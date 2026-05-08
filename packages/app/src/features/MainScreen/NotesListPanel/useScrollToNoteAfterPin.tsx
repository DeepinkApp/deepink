import { useEffect, useRef } from 'react';
import { NoteId } from '@core/features/notes';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useWorkspaceCommandCallback } from '@hooks/commands/useWorkspaceCommandCallback';
import { Virtualizer } from '@tanstack/react-virtual';

import { scrollAlignment } from './NotesList';

export const useScrollToNoteAfterPin = ({
	noteIds,
	virtualizer,
}: {
	noteIds: NoteId[];
	virtualizer: Virtualizer<any, any>;
}) => {
	const scrollTargetNoteIdRef = useRef<NoteId | null>(null);

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.TOGGLE_NOTE_PIN, ({ noteId }) => {
		scrollTargetNoteIdRef.current = noteId;
	});

	useEffect(() => {
		if (!scrollTargetNoteIdRef.current) return;

		const noteIndex = noteIds.indexOf(scrollTargetNoteIdRef.current);
		if (noteIndex === -1) return;

		scrollTargetNoteIdRef.current = null;
		virtualizer.scrollToIndex(noteIndex, { align: scrollAlignment });
	}, [noteIds, virtualizer]);
};
