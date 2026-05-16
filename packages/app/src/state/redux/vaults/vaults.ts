import ms from 'ms';
import z from 'zod';
import { INote, NoteId } from '@core/features/notes';
import { IResolvedTag } from '@core/features/tags';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { createAppSelector } from '../utils';
import { findNearNote } from './utils';

type VaultMutator<T extends {}> = (vault: VaultData, payload: T) => void;

export const defaultVaultConfig = {
	filesIntegrity: {
		enabled: false,
	},
	snapshots: {
		enabled: true,
		interval: ms('30s'),
	},
	deletion: {
		confirm: true,
		permanentDeletion: false,
		bin: {
			autoClean: false,
			cleanInterval: 30,
		},
	},
} satisfies VaultConfig;

export function createVaultReducer<T extends {} = {}>(mutator: VaultMutator<T>) {
	return (state: VaultsState, { payload }: PayloadAction<VaultScoped<T>>) => {
		const { vaultId, ...rest } = payload;
		const vault = state.vaults[vaultId];
		if (vault) {
			mutator(vault, rest as unknown as T);
		}
	};
}

const selectWorkspaceObject = (
	state: VaultsState,
	{ vaultId, workspaceId }: WorkspaceScoped,
) => {
	const vault = state.vaults[vaultId];
	if (!vault) return null;

	return vault.workspaces[workspaceId] ?? null;
};

export enum NOTES_VIEW {
	All_NOTES = 'All notes',
	BIN = 'Bin',
	BOOKMARK = 'Bookmark',
	ARCHIVE = 'Archive',
}

export const createWorkspaceObject = ({
	newNoteTemplate,
	...workspace
}: {
	id: string;
	name: string;
	newNoteTemplate: string;
}): WorkspaceData => ({
	...workspace,
	touched: false,
	loadingStatus: {
		isConfigLoaded: false,
		isFiltersLoaded: false,
		isOpenedNotesLoaded: false,
		isNoteIdsLoaded: false,
		isTagsLoaded: false,
	},

	activeNote: null,
	recentlyClosedNotes: [],
	openedNotes: [],
	previewTabId: null,

	noteIds: [],

	search: '',

	view: NOTES_VIEW.All_NOTES,

	tags: {
		selected: null,
		list: [],
	},

	config: {
		newNote: {
			title: newNoteTemplate,
			tags: 'selected',
		},
	},
});

export type VaultScoped<T extends {} = {}> = T & {
	vaultId: string;
};
export type WorkspaceScoped<T extends {} = {}> = T &
	VaultScoped<{
		workspaceId: string;
	}>;

export const WorkspaceConfigScheme = z.object({
	newNote: z.object({
		title: z.string(),
		tags: z.union([z.literal('none'), z.literal('selected')]),
	}),
});

export type LoadingStatus = {
	isConfigLoaded: boolean;

	/** Filters are selected tags, note view, and search */
	isFiltersLoaded: boolean;
	isOpenedNotesLoaded: boolean;
	isNoteIdsLoaded: boolean;
	isTagsLoaded: boolean;
};

export type WorkspaceData = {
	id: string;
	name: string;
	loadingStatus: LoadingStatus;

	/**
	 * Defines were workspace opened by user or not
	 *
	 * Not touched workspaces will not be rendered,
	 * to optimize performance
	 */
	touched: boolean;

	activeNote: NoteId | null;
	recentlyClosedNotes: NoteId[];
	openedNotes: INote[];
	previewTabId: NoteId | null;

	noteIds: NoteId[];

	search: string;
	view: NOTES_VIEW;
	tags: {
		selected: string | null;
		list: IResolvedTag[];
	};

	config: z.output<typeof WorkspaceConfigScheme>;
};

export const VaultConfigScheme = z.object({
	filesIntegrity: z.object({
		enabled: z.boolean(),
	}),
	snapshots: z.object({
		enabled: z.boolean(),
		interval: z.number(),
	}),
	deletion: z.object({
		confirm: z.boolean(),
		permanentDeletion: z.boolean(),
		bin: z.object({
			autoClean: z.boolean(),
			cleanInterval: z.number(),
		}),
	}),
});

export type VaultConfig = z.output<typeof VaultConfigScheme>;

export type VaultData = {
	activeWorkspace: string | null;
	workspaces: Record<string, WorkspaceData | undefined>;

	config: VaultConfig;
};

export type VaultsState = {
	activeVault: string | null;
	vaults: Record<string, VaultData | undefined>;
};

export const vaultsSlice = createSlice({
	name: 'vaults',
	initialState: {
		activeVault: null,
		vaults: {},
	} as VaultsState,
	reducers: {
		setVaults: (state, { payload }: PayloadAction<Record<string, VaultData>>) => {
			return { ...state, vaults: payload } as VaultsState;
		},

		addVault: (
			state,
			{
				payload: { vaultId, vault },
			}: PayloadAction<{ vaultId: string; vault: VaultData }>,
		) => {
			state.vaults[vaultId] = vault;
		},

		removeVault: (
			state,
			{ payload: { vaultId } }: PayloadAction<{ vaultId: string }>,
		) => {
			delete state.vaults[vaultId];
		},

		setActiveVault: (state, { payload }: PayloadAction<string | null>) => {
			state.activeVault = payload;
		},

		updateWorkspacesList: (
			state,
			{
				payload: { vaultId, workspaces, newNoteTemplate },
			}: PayloadAction<
				VaultScoped<{
					workspaces: { id: string; name: string }[];
					newNoteTemplate: string;
				}>
			>,
		) => {
			const vault = state.vaults[vaultId];
			if (!vault) return;

			workspaces.forEach((workspace) => {
				// Rename
				const existingWorkspace = vault.workspaces[workspace.id];
				if (existingWorkspace) {
					existingWorkspace.name = workspace.name;
					return;
				}

				// Create new workspace
				vault.workspaces[workspace.id] = createWorkspaceObject({
					...workspace,
					newNoteTemplate,
				});
			});

			// Delete workspaces that no more exists
			const actualWorkspaceIds = new Set(
				workspaces.map((workspace) => workspace.id),
			);
			for (const id in vault.workspaces) {
				if (!actualWorkspaceIds.has(id)) {
					delete vault.workspaces[id];
				}
			}
		},

		setActiveWorkspace: (
			state,
			{
				payload: { vaultId, workspaceId },
			}: PayloadAction<VaultScoped<{ workspaceId: string | null }>>,
		) => {
			const vault = state.vaults[vaultId];
			if (!vault) return;

			// Reset active workspace
			if (workspaceId === null) {
				vault.activeWorkspace = null;
				return;
			}

			const workspace = vault.workspaces[workspaceId];
			if (!workspace) return;

			// Touch workspace
			workspace.touched = true;

			vault.activeWorkspace = workspaceId;
		},

		/**
		 * Saves the workspace in the workspace list and resets all data to default
		 */
		resetWorkspace: (
			state,
			{
				payload: { vaultId, workspaceId, newNoteTemplate },
			}: PayloadAction<
				VaultScoped<{ workspaceId: string; newNoteTemplate: string }>
			>,
		) => {
			const vault = state.vaults[vaultId];
			if (!vault) return;

			const workspace = vault.workspaces[workspaceId];
			if (!workspace) return;

			// Reset all values to defaults
			vault.workspaces[workspaceId] = createWorkspaceObject({
				id: workspace.id,
				name: workspace.name,
				newNoteTemplate,
			});
		},

		updateWorkspaceLoadingStatus: (
			state,
			{
				payload: { vaultId, workspaceId, ...status },
			}: PayloadAction<WorkspaceScoped<Partial<LoadingStatus>>>,
		) => {
			const workspace = selectWorkspaceObject(state, { vaultId, workspaceId });
			if (!workspace) return;

			workspace.loadingStatus = { ...workspace.loadingStatus, ...status };
		},

		setActiveNote: (
			state,
			{
				payload: { vaultId, workspaceId, noteId },
			}: PayloadAction<WorkspaceScoped<{ noteId: NoteId | null }>>,
		) => {
			const workspace = selectWorkspaceObject(state, { vaultId, workspaceId });
			if (!workspace) return;

			// Set null and avoid array iterating
			if (noteId === null) {
				workspace.activeNote = noteId;
				return;
			}

			// Skip if note is not opened
			const isOpenedNote = workspace.openedNotes.some((note) => note.id === noteId);
			if (!isOpenedNote) return;

			workspace.activeNote = noteId;
		},

		setNoteIds: (
			state,
			{
				payload: { vaultId, workspaceId, noteIds },
			}: PayloadAction<WorkspaceScoped<{ noteIds: NoteId[] }>>,
		) => {
			const workspace = selectWorkspaceObject(state, { vaultId, workspaceId });
			if (!workspace) return;

			workspace.noteIds = noteIds;
		},

		addOpenedNote: (
			state,
			{
				payload: { vaultId, workspaceId, note, active, preview },
			}: PayloadAction<
				WorkspaceScoped<{
					note: INote;
					preview?: boolean;
					active?: boolean;
				}>
			>,
		) => {
			const workspace = selectWorkspaceObject(state, { vaultId, workspaceId });
			if (!workspace) return;

			const foundNoteInList = workspace.openedNotes.find(
				({ id }) => id === note.id,
			);

			// Ignore already exists note
			if (foundNoteInList) return;

			if (preview) {
				if (workspace.previewTabId) {
					// Only one preview note can be open at a time — close the previous one
					workspace.openedNotes = workspace.openedNotes.filter(
						({ id }) => id !== workspace.previewTabId,
					);
				}
				workspace.previewTabId = note.id;
			}

			workspace.openedNotes.push(note);

			if (active) {
				workspace.activeNote = note.id;
			}

			// Remove from recently closed if it was there
			const filteredClosedNotes = workspace.recentlyClosedNotes.filter(
				(id) => id !== note.id,
			);
			if (workspace.recentlyClosedNotes.length !== filteredClosedNotes.length) {
				workspace.recentlyClosedNotes = filteredClosedNotes;
			}
		},

		removeOpenedNote: (
			state,
			{
				payload: { vaultId, workspaceId, noteId },
			}: PayloadAction<WorkspaceScoped<{ noteId: NoteId }>>,
		) => {
			const workspace = selectWorkspaceObject(state, { vaultId, workspaceId });
			if (!workspace) return;

			const { activeNote, openedNotes } = workspace;

			const filteredNotes = openedNotes.filter(({ id }) => id !== noteId);

			workspace.activeNote =
				activeNote !== noteId
					? activeNote
					: (findNearNote(openedNotes, activeNote)?.id ?? null);
			workspace.openedNotes =
				filteredNotes.length !== openedNotes.length ? filteredNotes : openedNotes;

			workspace.recentlyClosedNotes.push(noteId);

			// Reset preview note
			if (workspace.previewTabId === noteId) {
				workspace.previewTabId = null;
			}
		},

		updateOpenedNote: (
			state,
			{
				payload: { vaultId, workspaceId, note },
			}: PayloadAction<WorkspaceScoped<{ note: INote }>>,
		) => {
			const workspace = selectWorkspaceObject(state, { vaultId, workspaceId });
			if (!workspace) return;

			const { openedNotes } = workspace;

			// Ignore not exists notes
			const noteIndex = openedNotes.findIndex(({ id }) => id === note.id);
			if (noteIndex === -1) return;

			workspace.openedNotes = [
				...openedNotes.slice(0, noteIndex),
				note,
				...openedNotes.slice(noteIndex + 1),
			];
		},

		setOpenedNotesState: (
			state,
			{
				payload: { vaultId, workspaceId, notes, activeNoteId, previewTabId },
			}: PayloadAction<
				WorkspaceScoped<{
					notes: INote[];
					activeNoteId: NoteId;
					previewTabId: NoteId | null;
				}>
			>,
		) => {
			const workspace = selectWorkspaceObject(state, { vaultId, workspaceId });
			if (!workspace) return;

			workspace.openedNotes = notes;
			workspace.activeNote = activeNoteId;
			workspace.previewTabId = previewTabId;
		},

		convertPreviewToRegular: (
			state,
			{ payload: { vaultId, workspaceId } }: PayloadAction<WorkspaceScoped>,
		) => {
			const workspace = selectWorkspaceObject(state, { vaultId, workspaceId });
			if (!workspace) return;

			workspace.previewTabId = null;
		},

		setSelectedTag: (
			state,
			{
				payload: { vaultId, workspaceId, tag },
			}: PayloadAction<WorkspaceScoped<{ tag: string | null }>>,
		) => {
			const workspace = selectWorkspaceObject(state, { vaultId, workspaceId });
			if (!workspace) return;

			workspace.tags.selected = tag;

			// Reset selected if no tag exist
			const isSelectedTagExists = workspace.tags.list.some(
				({ id }) => id === workspace.tags.selected,
			);
			if (!isSelectedTagExists) {
				workspace.tags.selected = null;
			}
		},

		setTags: (
			state,
			{
				payload: { vaultId, workspaceId, tags },
			}: PayloadAction<WorkspaceScoped<{ tags: IResolvedTag[] }>>,
		) => {
			const workspace = selectWorkspaceObject(state, { vaultId, workspaceId });
			if (!workspace) return;

			workspace.tags.list = tags;

			// Reset selected if no tag exist
			const isSelectedTagExists = workspace.tags.list.some(
				({ id }) => id === workspace.tags.selected,
			);
			if (!isSelectedTagExists) {
				workspace.tags.selected = null;
			}
		},

		setSearch: (
			state,
			{
				payload: { vaultId, workspaceId, search },
			}: PayloadAction<WorkspaceScoped<{ search: string }>>,
		) => {
			const workspace = selectWorkspaceObject(state, { vaultId, workspaceId });
			if (!workspace) return;

			workspace.search = search;
		},
		setView: (
			state,
			{
				payload: { vaultId, workspaceId, view },
			}: PayloadAction<WorkspaceScoped<{ view: NOTES_VIEW }>>,
		) => {
			const workspace = selectWorkspaceObject(state, { vaultId, workspaceId });
			if (!workspace) return;

			workspace.view = view;
		},

		updateFilters: (
			state,
			{
				payload: { vaultId, workspaceId, view, search, selectedTagId },
			}: PayloadAction<
				WorkspaceScoped<
					Partial<{
						view: NOTES_VIEW;
						search: string;
						selectedTagId: string | null;
					}>
				>
			>,
		) => {
			const workspace = selectWorkspaceObject(state, { vaultId, workspaceId });
			if (!workspace) return;

			if (view !== undefined) {
				workspace.view = view;
			}
			if (search !== undefined) {
				workspace.search = search;
			}

			// Set the selected tag if it exists in the tags list
			if (selectedTagId !== undefined) {
				const isSelectedTagExists =
					selectedTagId !== null &&
					workspace.tags.list.some(({ id }) => id === selectedTagId);

				workspace.tags.selected = isSelectedTagExists ? selectedTagId : null;
			}
		},

		setWorkspaceNoteTemplateConfig: (
			state,
			{
				payload: { vaultId, workspaceId, ...props },
			}: PayloadAction<
				WorkspaceScoped<Partial<WorkspaceData['config']['newNote']>>
			>,
		) => {
			const workspace = selectWorkspaceObject(state, { vaultId, workspaceId });
			if (!workspace) return;

			workspace.config.newNote = { ...workspace.config.newNote, ...props };
		},

		setSnapshotsConfig: createVaultReducer(
			(vault, payload: Partial<VaultData['config']['snapshots']>) => {
				vault.config.snapshots = {
					...vault.config.snapshots,
					...payload,
				};
			},
		),

		setNoteDeletionConfig: createVaultReducer(
			(
				vault,
				payload: Partial<
					Pick<VaultData['config']['deletion'], 'permanentDeletion' | 'confirm'>
				>,
			) => {
				vault.config.deletion = {
					...vault.config.deletion,
					...payload,
				};
			},
		),
		setBinAutoDeletionConfig: createVaultReducer(
			(vault, payload: Partial<VaultData['config']['deletion']['bin']>) => {
				vault.config.deletion.bin = {
					...vault.config.deletion.bin,
					...payload,
				};
			},
		),
		setFilesIntegrityConfig: createVaultReducer(
			(vault, payload: Partial<VaultData['config']['filesIntegrity']>) => {
				vault.config.filesIntegrity = {
					...vault.config.filesIntegrity,
					...payload,
				};
			},
		),
	},
});

export const workspacesApi = vaultsSlice.actions;

export const selectActiveVault = createAppSelector(vaultsSlice.selectSlice, (state) => {
	return state.activeVault ?? null;
});

export const selectVaultById = ({ vaultId }: VaultScoped) =>
	createAppSelector(vaultsSlice.selectSlice, (state) => {
		const vault = state.vaults[vaultId];
		return vault ?? null;
	});

export const selectWorkspaces = ({ vaultId }: VaultScoped) =>
	createAppSelector(vaultsSlice.selectSlice, (state) => {
		const vault = state.vaults[vaultId];
		if (!vault) return [];

		return Object.values(vault.workspaces ?? {}).filter(Boolean) as WorkspaceData[];
	});

/**
 * Workspace info subset that will be persistent for notes changes
 */
export const getWorkspaceInfo = ({ id, name, touched }: WorkspaceData) => ({
	id,
	name,
	touched,
});

export const selectWorkspacesInfo = (scope: VaultScoped) =>
	createAppSelector(selectWorkspaces(scope), (workspaces) =>
		workspaces.map(getWorkspaceInfo),
	);

export const selectWorkspace = ({ vaultId, workspaceId }: WorkspaceScoped) =>
	createAppSelector(vaultsSlice.selectSlice, (state) => {
		const vault = state.vaults[vaultId];
		if (!vault) return null;

		return vault.workspaces[workspaceId] ?? null;
	});

export const selectActiveWorkspace = ({ vaultId }: VaultScoped) =>
	createAppSelector(vaultsSlice.selectSlice, (state) => {
		const vault = state.vaults[vaultId];
		if (!vault || !vault.activeWorkspace) return null;

		return vault.workspaces[vault.activeWorkspace] ?? null;
	});

export const selectActiveWorkspaceInfo = (scope: VaultScoped) =>
	createAppSelector(selectActiveWorkspace(scope), (workspace) =>
		workspace ? getWorkspaceInfo(workspace) : null,
	);

export * from './selectors/notes';
export * from './selectors/tags';
