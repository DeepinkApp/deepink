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

		// Briefly highlight the note so the user can find it at its new position
		setFlashingNoteId(noteId);
		setTimeout(() => {
			setFlashingNoteId(null);
		}, 800);
	});

	// Wait for noteIds to update after pin before scrolling
	// otherwise scrolling may use the old note position
	useEffect(() => {
		if (!targetNoteIdRef.current) return;

		const noteIndex = noteIds.indexOf(targetNoteIdRef.current);
		if (noteIndex === -1) return;

		targetNoteIdRef.current = null;

		// 'auto' allows skipping scroll if the element is already in the viewport
		virtualizer.scrollToIndex(noteIndex, { align: 'auto' });
	}, [noteIds, virtualizer]);

	return { flashingNoteId };
};
