import z from 'zod';
import { NOTES_VIEW } from '@state/redux/vaults/vaults';

export const WorkspaceStateScheme = z.object({
	openedNoteIds: z.array(z.string()).nullable(),
	activeNoteId: z.string().nullable(),
	temporaryNotesId: z.array(z.string()),
	selectedTagId: z.string().nullable(),
	view: z.enum(NOTES_VIEW),
	search: z.string(),
});

export type WorkspaceStateData = z.output<typeof WorkspaceStateScheme>;
