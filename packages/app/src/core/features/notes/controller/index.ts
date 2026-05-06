import { INote, INoteContent, NoteId } from '..';

export type NoteMeta = {
	isSnapshotsDisabled: boolean;
	isVisible: boolean;
	isDeleted: boolean;
	isArchived: boolean;
	isBookmarked: boolean;
	isPinned: boolean;
};

export type NoteSortField = 'id' | 'createdAt' | 'updatedAt' | 'deletedAt';

export type NoteContentUpdateInfo = {
	id: NoteId;
	updatedAt?: number | false;
} & INoteContent;

type DateRange = {
	/**
	 * inclusive
	 */
	from: Date;

	/**
	 * exclusive
	 */
	to: Date;
};

export type NotesControllerFetchOptions = {
	/**
	 * Limit notes
	 *
	 * @default 100
	 */
	limit?: number;

	/**
	 * Page number start of 1
	 *
	 * Implementations must thrown error for values less than 1
	 *
	 * @default 1
	 */
	page?: number;

	/**
	 * Filter notes by tags
	 */
	tags?: string[];

	/**
	 * Filters by note meta info
	 */
	meta?: Partial<NoteMeta>;

	search?: {
		text: string;
	};

	/**
	 * Filter by deletion date
	 */
	deletedAt?: Partial<DateRange>;

	/**
	 * Filter by update date
	 */
	updatedAt?: Partial<DateRange>;

	/**
	 * Sorting options
	 */
	sort?: {
		by: NoteSortField;
		order?: 'desc' | 'asc';
		pinned?: boolean;
	};
};

export type ControlledNoteMeta = Partial<NoteMeta> & { updatedAt?: number };

/**
 * Notes controller interface
 */
export interface INotesController {
	/**
	 * Get notes by IDs
	 */
	getById(id: NoteId[]): Promise<INote[]>;

	/**
	 * Get number of notes
	 */
	getLength(query?: NotesControllerFetchOptions): Promise<number>;

	/**
	 * Get note IDs filtered by parameters
	 */
	query(query?: NotesControllerFetchOptions): Promise<NoteId[]>;

	/**
	 * Primary method to get notes filtered by parameters
	 */
	get(options?: NotesControllerFetchOptions): Promise<INote[]>;

	/**
	 * Create note and return unique id of new note
	 */
	add(note: INoteContent, meta?: Partial<ControlledNoteMeta>): Promise<NoteId>;

	/**
	 * Update note by unique id
	 *
	 * @deprecated use `updateBatch` instead
	 */
	update(id: NoteId, updatedNote: INoteContent): Promise<void>;

	/**
	 * Update multiple notes by their unique ids
	 */
	updateBatch(notes: NoteContentUpdateInfo[]): Promise<void>;

	/**
	 * Update note meta information
	 */
	updateMeta(ids: NoteId[], meta: Partial<ControlledNoteMeta>): Promise<void>;

	/**
	 * Deletes all notes with specified ids
	 */
	delete(ids: NoteId[]): Promise<void>;
}
