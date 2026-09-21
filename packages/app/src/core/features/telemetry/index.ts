export type EventPayload = Record<string, any>;
export interface EventTracker {
	sendEvent(eventName: string, props?: EventPayload): Promise<void>;
}

export enum TELEMETRY_EVENT_NAME {
	APP_OPENED = 'App opened',
	APP_CLOSED = 'App closed',
	APP_INSTALLED = 'App installed',
	APP_UPDATED = 'App updated',

	COMMAND_USE = 'Command use',

	SETTINGS_CLICK = 'Settings click',

	SEARCH_IN_NOTES = 'Search in notes',

	IMPORT_NOTES = 'Import notes',
	EXPORT_NOTES = 'Export notes',

	EDITOR_MODE_CHANGED = 'Editor mode changed',

	NOTE_CREATED = 'Note created',
	NOTE_DELETED = 'Note deleted',
	NOTE_OPENED = 'Note opened',
	NOTE_CLOSED = 'Note closed',
	NOTE_RESTORED_FROM_BIN = 'Note restored from bin',

	NOTE_ARCHIVE_TOGGLE = 'Note archive toggled',
	NOTE_BOOKMARK_TOGGLE = 'Note bookmark toggled',
	NOTE_PIN_TOGGLE = 'Note pin toggled',

	NOTE_TAG_ATTACHED = 'Tag attached',
	NOTE_TAG_DETACHED = 'Tag detached',

	NOTE_CONTEXT_MENU_CLICK = 'Note context menu click',

	NOTE_SIDE_PANEL_SHOWN = 'Note side panel shown',

	NOTE_VERSION_VIEWED = 'Note version viewed',
	NOTE_VERSION_APPLIED = 'Note version applied',
	NOTE_VERSION_DELETED = 'Note version deleted',

	TAG_CREATED = 'Tag created',
	TAG_EDITED = 'Tag edited',
	TAG_DELETED = 'Tag deleted',

	WORKSPACE_ADDED = 'Workspace added',
	WORKSPACE_DELETE_CLICK = 'Workspace delete click',
	WORKSPACE_SELECTED = 'Workspace selected',
	WORKSPACE_OPEN_FAILED = 'Workspace open failed',

	VAULT_OPEN = 'Vault open',
	VAULT_CREATED = 'Vault created',
	VAULT_SELECTED = 'Vault selected',
	VAULT_OPEN_FAILED = 'Vault open failed',

	MAIN_WINDOW_LOADED = 'Main window loaded',
	MAIN_WINDOW_RESIZE = 'Main window resize',

	ABOUT_WINDOW_CLICK = 'Click for About window',
	DEV_TOOLS_TOGGLED = 'Dev Tools toggled',

	TELEMETRY_QUEUE_PROCESSED = 'Queued telemetry events sent',
}
