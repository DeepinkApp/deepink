import { INote, NoteId } from '@core/features/notes';
import { createSelector } from '@reduxjs/toolkit';

import { VaultData, WorkspaceData } from './vaults';

export const createWorkspaceSelector = createSelector.withTypes<WorkspaceData>();
export const createVaultSelector = createSelector.withTypes<VaultData>();

export const selectWorkspaceRoot = (workspace: WorkspaceData | null) => workspace;

export const selectWorkspaceRootSafe = (workspace: WorkspaceData | null) => {
	if (!workspace) throw new Error('Workspace selector used out of workspace scope');
	return workspace;
};

/**
 * Find a note near current, but except current note in edge cases
 */
export const findNearNote = (notes: INote[], noteId: NoteId) => {
	const currentNoteIndex = notes.findIndex((note) => note.id === noteId);
	if (currentNoteIndex === -1) {
		return notes.length === 0 ? null : (notes.at(-1) ?? null);
	}

	if (notes.length === 1) return null;

	const prevIndex = currentNoteIndex - 1;
	const nextIndex = currentNoteIndex + 1;
	return notes[prevIndex] ?? notes[nextIndex] ?? null;
};

/**
 * Ensure touched notes contains only opened notes
 */
export const syncTouchedNotes = (workspace: WorkspaceData) => {
	const openedNoteIds = new Set(workspace.openedNotes.map((n) => n.id));

	// Leave only ids of opened notes
	workspace.touchedNoteIds = Object.fromEntries(
		Object.entries(workspace.touchedNoteIds).filter(([noteId]) =>
			openedNoteIds.has(noteId),
		),
	);

	// Ensure active note is touched
	if (workspace.activeNote) {
		workspace.touchedNoteIds[workspace.activeNote] = true;
	}
};
