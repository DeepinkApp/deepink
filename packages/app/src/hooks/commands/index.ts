import { Shortcuts } from '../shortcuts';

export enum GLOBAL_COMMANDS {
	/**
	 * Create and open a new note
	 */
	CREATE_NOTE = 'Create note',
	CLOSE_CURRENT_NOTE = 'Close current note',

	/**
	 * Reopen the last closed note
	 */
	RESTORE_CLOSED_NOTE = 'Restore closed note',

	/**
	 * Switch focus to the next open note
	 */
	FOCUS_NEXT_NOTE = 'Focus next note',

	/**
	 * Switch focus to the previous open note
	 */
	FOCUS_PREVIOUS_NOTE = 'Focus previous note',

	DELETE_NOTE_PERMANENTLY = 'Delete note permanently',
	MOVE_NOTE_TO_BIN = 'Move note to bin',
	RESTORE_NOTE_FROM_BIN = 'Restore note from bin',
	TOGGLE_NOTE_ARCHIVE = 'Toggle note archive status',
	TOGGLE_NOTE_BOOKMARK = 'Toggle note bookmark status',
	TOGGLE_NOTE_PIN = 'Toggle note pin status',

	/**
	 * Open and close the history for a note
	 */
	TOGGLE_NOTE_HISTORY_PANEL = 'Toggle note history panel',
	EXPORT_NOTE = 'Export note',
	COPY_NOTE_MARKDOWN_LINK = 'Copy Markdown link',

	/**
	 * Creates a copy of an existing note
	 */
	DUPLICATE_NOTE = 'Duplicate note',
	OPEN_GLOBAL_SETTINGS = 'Open global settings',
	SYNC_DATABASE = 'Synchronize database',

	LOCK_CURRENT_VAULT = 'Lock current vault',
	FOCUS_SEARCH = 'Focus search input',

	SHORTCUT_PRESSED = 'Shortcut pressed',

	SCROLL_TO_NOTE = 'Scroll to note',
}

type CommandsWithPayload = {
	[GLOBAL_COMMANDS.DELETE_NOTE_PERMANENTLY]: { noteId: string };
	[GLOBAL_COMMANDS.MOVE_NOTE_TO_BIN]: { noteId: string };
	[GLOBAL_COMMANDS.RESTORE_NOTE_FROM_BIN]: { noteId: string };

	[GLOBAL_COMMANDS.TOGGLE_NOTE_ARCHIVE]: { noteId: string };
	[GLOBAL_COMMANDS.TOGGLE_NOTE_BOOKMARK]: { noteId: string };
	[GLOBAL_COMMANDS.TOGGLE_NOTE_PIN]: { noteId: string };
	[GLOBAL_COMMANDS.TOGGLE_NOTE_HISTORY_PANEL]: { noteId: string };

	[GLOBAL_COMMANDS.EXPORT_NOTE]: { noteId: string };
	[GLOBAL_COMMANDS.COPY_NOTE_MARKDOWN_LINK]: { noteId: string };
	[GLOBAL_COMMANDS.DUPLICATE_NOTE]: { noteId: string };

	[GLOBAL_COMMANDS.SHORTCUT_PRESSED]: { shortcut: Shortcuts };

	[GLOBAL_COMMANDS.SCROLL_TO_NOTE]: { noteId: string };
};

export type CommandPayloadsMap = {
	[K in GLOBAL_COMMANDS]: K extends keyof CommandsWithPayload
		? CommandsWithPayload[K]
		: void;
};
