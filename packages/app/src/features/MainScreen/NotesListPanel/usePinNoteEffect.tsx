import { useEffect, useRef, useState } from 'react';
import { NoteId } from '@core/features/notes';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useWorkspaceCommandCallback } from '@hooks/commands/useWorkspaceCommandCallback';
import { Virtualizer } from '@tanstack/react-virtual';

export const usePinNoteEffect = ({
	noteIds,
	virtualizer,
}: {
	noteIds: NoteId[];
	virtualizer: Virtualizer<any, any>;
}) => {
	const targetNoteIdRef = useRef<NoteId | null>(null);
	const [flashingNoteId, setFlashingNoteId] = useState<NoteId | null>(null);

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.TOGGLE_NOTE_PIN, ({ noteId }) => {
		targetNoteIdRef.current = noteId;
	});

	// Wait for noteIds to update after pin before scrolling
	useEffect(() => {
		if (!targetNoteIdRef.current) return;

		const noteIndex = noteIds.indexOf(targetNoteIdRef.current);
		if (noteIndex === -1) return;

		targetNoteIdRef.current = null;

		// If the note is in the viewport, do not scroll
		virtualizer.scrollToIndex(noteIndex, { align: 'auto' });

		// Briefly highlight the note so the user can find it at its new position
		setFlashingNoteId(targetNoteIdRef.current);
		const timer = setTimeout(() => {
			setFlashingNoteId(null);
		}, 800);

		return () => clearTimeout(timer);
	}, [noteIds, virtualizer]);

	return { flashingNoteId };
};
