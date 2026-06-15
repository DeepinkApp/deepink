import { NoteId } from '@core/features/notes';

export enum WorkspaceEvents {
	NOTES_UPDATED = 'notesUpdated',
	NOTE_UPDATED = 'noteUpdated',
	NOTE_EDITED = 'noteChanged',
	NOTE_HISTORY_UPDATED = 'noteHistoryUpdated',
}

/**
 * Events payload map
 */

export type WorkspaceEventsPayloadMap = {
	/**
	 * Fired when many notes has been changed
	 */
	[WorkspaceEvents.NOTES_UPDATED]: void;

	/**
	 * Fired when specific note  has been updated not via editor, and change is committed in DB
	 *
	 * For example note version has been applied or remote end force updated a note
	 */
	[WorkspaceEvents.NOTE_UPDATED]: NoteId;

	/**
	 * Fired when note has been edited by user and change is committed in DB
	 */
	[WorkspaceEvents.NOTE_EDITED]: NoteId;

	/**
	 * Fired when history of specific note has been updated
	 */
	[WorkspaceEvents.NOTE_HISTORY_UPDATED]: NoteId;
};
