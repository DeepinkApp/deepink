/* eslint-disable camelcase */
import { Query } from 'nano-queries';
import { z } from 'zod';
import { SQLiteDB } from '@core/database/sqlite';
import { DBTypes, qb } from '@core/database/sqlite/utils/query-builder';
import { wrapSQLite } from '@core/database/sqlite/utils/wrapDB';

import { FlexSearchIndex } from '../../../database/flexsearch/FlexSearchIndex';

import { INote, INoteContent, NoteId } from '..';
import {
	ControlledNoteMeta,
	INotesController,
	NoteContentUpdateInfo,
	NoteMeta,
	NotesControllerFetchOptions,
	NoteSortField,
} from '.';

const RowScheme = z
	.object({
		id: z.string(),
		title: z.string(),
		text: z.string(),
		created_at: z.coerce.date(),
		updated_at: z.coerce.date(),
		history_disabled: z.coerce.boolean(),
		visible: z.coerce.boolean(),
		deleted_at: z.coerce.date().nullable(),
		archived: z.coerce.boolean(),
		bookmarked: z.coerce.boolean(),
		pinned_at: z.coerce.date().nullable(),
	})
	.transform(
		({
			id,
			title,
			text,
			created_at,
			updated_at,
			history_disabled,
			visible,
			deleted_at,
			archived,
			bookmarked,
			pinned_at,
		}): INote => ({
			id,
			createdTimestamp: created_at.getTime(),
			updatedTimestamp: updated_at.getTime(),
			isSnapshotsDisabled: history_disabled,
			isVisible: visible,
			isDeleted: deleted_at !== null,
			deletedAt: deleted_at?.getTime(),
			isArchived: archived,
			isBookmarked: bookmarked,
			isPinned: pinned_at !== null,
			content: { title, text },
		}),
	);

function formatNoteMeta(meta: Partial<NoteMeta>) {
	const fields: Record<string, DBTypes> = {};

	for (const item of Object.entries(meta)) {
		const [key, value] = item as unknown as {
			[K in keyof NoteMeta]: [K, NoteMeta[K]];
		}[keyof NoteMeta];

		switch (key) {
			case 'isSnapshotsDisabled':
				fields['history_disabled'] = Number(value);
				break;
			case 'isVisible':
				fields['visible'] = Number(value);
				break;
			case 'isDeleted':
				fields['deleted_at'] = value ? new Date().getTime() : null;
				break;
			case 'isArchived':
				fields['archived'] = Number(value);
				break;
			case 'isBookmarked':
				fields['bookmarked'] = Number(value);
				break;
			case 'isPinned':
				fields['pinned_at'] = value ? new Date().getTime() : null;
				break;
		}
	}

	return fields;
}

function getFetchQuery(
	{
		select,
		workspace,
	}: {
		select: Query<DBTypes>;
		workspace?: string;
	},
	{
		limit,
		page,
		tags = [],
		meta: { isDeleted, ...meta } = {},
		deletedAt = {},
		updatedAt = {},
		sort,
	}: Omit<NotesControllerFetchOptions, 'search'> = {},
) {
	if (page !== undefined && page < 1)
		throw new TypeError('Page value must not be less than 1');

	const sortFieldMap: Record<NoteSortField, string> = {
		id: 'id',
		createdAt: 'created_at',
		updatedAt: 'updated_at',
		deletedAt: 'deleted_at',
		pinnedAt: 'pinned_at',
	};

	const withQuery: { name: string; query: Query<DBTypes> }[] = [];
	const selectAddonsQuery: Query<DBTypes>[] = [];
	const joinQuery: Query<DBTypes>[] = [];
	const filterQuery: Query<DBTypes>[] = [];
	const orderQuery: Query<DBTypes>[] = [];

	// Filtering
	if (tags.length > 0) {
		filterQuery.push(
			qb.sql`id IN (SELECT note_id FROM note_tags WHERE tag_id IN (${qb.values(
				tags,
			)}))`,
		);
	}

	const metaEntries = Object.entries(
		formatNoteMeta({
			isVisible: true,
			...meta,
		}),
	);
	if (metaEntries.length > 0) {
		filterQuery.push(
			...metaEntries.map(([key, value]) => qb.sql`${qb.raw(key)} = ${value}`),
		);
	}

	if (isDeleted !== undefined) {
		filterQuery.push(
			qb.sql`deleted_at IS ${isDeleted ? qb.sql`NOT NULL` : qb.sql`NULL`}`,
		);
	}

	if (deletedAt.from) {
		filterQuery.push(qb.sql`deleted_at >= ${deletedAt.from.getTime()}`);
	}
	if (deletedAt.to) {
		filterQuery.push(qb.sql`deleted_at <= ${deletedAt.to.getTime()}`);
	}

	if (updatedAt.from) {
		filterQuery.push(qb.sql`updated_at >= ${updatedAt.from.getTime()}`);
	}
	if (updatedAt.to) {
		filterQuery.push(qb.sql`updated_at <= ${updatedAt.to.getTime()}`);
	}

	// Sort
	if (sort) {
		sort.forEach((rule) => {
			orderQuery.push(
				qb.line(sortFieldMap[rule.by], rule.order === 'desc' ? 'DESC' : 'ASC'),
			);
		});
	}

	return qb.line(
		withQuery.length > 0
			? qb.line(
					'WITH',
					qb.set(
						withQuery.map(
							({ name, query }) => qb.sql`${qb.raw(name)} AS (${query})`,
						),
					),
				)
			: undefined,
		qb.sql`SELECT ${qb.set([select, ...selectAddonsQuery])} FROM notes`,
		(joinQuery.length > 0 || undefined) && qb.line(...joinQuery),
		qb
			.where(workspace ? qb.sql`workspace_id=${workspace}` : undefined)
			.and(
				qb.line(
					...filterQuery.map((query, index) =>
						index === 0 ? query : qb.sql`AND ${query}`,
					),
				),
			),
		orderQuery.length > 0 ? qb.sql`ORDER BY ${qb.set(orderQuery)}` : undefined,
		limit ? qb.limit(limit) : undefined,
		page && limit ? qb.offset((page - 1) * limit) : undefined,
	);
}

function intersectSets<T>(a: Set<T>, b: Set<T>): Set<T> {
	// Always iterate over the smaller set for fewer lookups
	const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];

	const result = new Set<T>();
	for (const item of smaller) {
		if (larger.has(item)) {
			result.add(item);
		}
	}
	return result;
}

/**
 * Synced notes registry
 */
export class NotesController implements INotesController {
	constructor(
		private readonly db: SQLiteDB,
		private readonly workspace: string,
		private readonly index?: FlexSearchIndex,
	) {}

	public async getById(ids: NoteId[]): Promise<INote[]> {
		const db = wrapSQLite(this.db);

		const rows = await db.query(
			qb.sql`SELECT * FROM notes WHERE workspace_id = ${this.workspace} AND id IN ${qb.values(ids).withParenthesis()}`,
			RowScheme,
		);

		const rowsMap = new Map(rows.map((note) => [note.id, note]));
		const sortedNotes = ids
			.values()
			.map((id) => rowsMap.get(id))
			.filter((note) => note !== undefined)
			.toArray();

		if (sortedNotes.length !== ids.length) {
			console.warn(
				`Found notes count does not match the requested count. Expected: ${ids.length}; Found: ${sortedNotes.length}`,
			);
		}

		return sortedNotes;
	}

	protected async searchCandidates(
		query: NotesControllerFetchOptions,
	): Promise<string[]> {
		const db = wrapSQLite(this.db);

		// Handle simple case
		if (!query.search || !this.index) {
			return [];
		}

		// Iterative fetching
		const [textMatchCandidates, filtersCandidates] = await Promise.all([
			this.index.query(query.search.text).then((results) => new Set(results)),
			db
				.query(
					getFetchQuery(
						{ select: qb.sql`id`, workspace: this.workspace },
						{ ...query, limit: undefined, page: undefined },
					),
					z.object({ id: z.string() }).transform((row) => row.id),
				)
				.then((results) => new Set(results)),
		]);

		const results = intersectSets(textMatchCandidates, filtersCandidates);

		if (query.limit) {
			const offset =
				query.page && query.page > 0 ? (query.page - 1) * query.limit : 0;
			return results.values().drop(offset).take(query.limit).toArray();
		}

		return Array.from(results);
	}

	public async getLength(query: NotesControllerFetchOptions = {}): Promise<number> {
		const db = wrapSQLite(this.db);

		if (query.search && this.index)
			return this.searchCandidates({
				...query,
				page: undefined,
				limit: undefined,
			}).then((results) => results.length);

		const [{ count }] = await db.query(
			getFetchQuery(
				{ select: qb.sql`COUNT(*) as count`, workspace: this.workspace },
				query,
			),
			z.object({ count: z.number() }),
		);

		return count;
	}

	public async query(query: NotesControllerFetchOptions = {}): Promise<NoteId[]> {
		const db = wrapSQLite(this.db);

		if (query.search && this.index) {
			return this.searchCandidates(query);
		}

		return await db.query(
			getFetchQuery({ select: qb.sql`id`, workspace: this.workspace }, query),
			z.object({ id: z.string() }).transform((row) => row.id),
		);
	}

	public async get(query: NotesControllerFetchOptions = {}): Promise<INote[]> {
		const ids = await this.query(query);
		return this.getById(ids);
	}

	public async add(
		note: INoteContent,
		{ updatedAt, ...meta }: ControlledNoteMeta = {},
	): Promise<NoteId> {
		const creationTime = Date.now();

		// Insert data
		const metaEntries = Object.entries(formatNoteMeta(meta ?? {}));

		const db = wrapSQLite(this.db);

		const [id] = await db.query(
			qb.sql`INSERT INTO notes (${qb.set([
				qb.sql`"workspace_id","title","text","created_at","updated_at"`,
				...(metaEntries ? metaEntries.map(([key]) => key) : []),
			])}) VALUES (${qb.values([
				this.workspace,
				note.title,
				note.text,
				creationTime,
				updatedAt ?? creationTime,
				...metaEntries.map(([_key, value]) => value),
			])}) RETURNING id`,
			z.object({ id: z.string() }).transform(({ id }) => id),
		);

		return id;
	}

	public async update(id: string, updatedNote: INoteContent) {
		await this.updateBatch([{ id, ...updatedNote }]);
	}

	public async updateBatch(notes: NoteContentUpdateInfo[]) {
		if (notes.length === 0) return;

		const now = Date.now();
		const db = wrapSQLite(this.db);
		await db.query(
			qb.sql`WITH updates(id, title, text, updated_at) AS (
				VALUES ${qb.set(
					notes.map(({ id, title, text, updatedAt }) =>
						qb
							.values([
								id,
								title,
								text,
								updatedAt === false ? null : (updatedAt ?? now),
							])
							.withParenthesis(),
					),
				)}
			)
			UPDATE notes AS n
			SET
				title = updates.title,
				text = updates.text,
				updated_at = CASE
					WHEN updates.updated_at IS NULL THEN n.updated_at
					ELSE updates.updated_at
				END
			FROM updates
			WHERE n.id = updates.id AND workspace_id=${this.workspace}`,
		);
	}

	public async delete(ids: NoteId[]): Promise<void> {
		if (!ids.length) return;

		const db = wrapSQLite(this.db);

		await db.query(
			qb.sql`DELETE FROM notes WHERE workspace_id=${
				this.workspace
			} AND id IN (${qb.values(ids)})`,
		);

		if (this.index) {
			const index = await this.index.createIndexSession();
			await Promise.all(ids.map((id) => index.remove(id)));
			await index.commit();
		}
	}

	public async updateMeta(
		ids: NoteId[],
		{ updatedAt, ...meta }: ControlledNoteMeta = {},
	): Promise<void> {
		if (ids.length === 0) return;

		const db = wrapSQLite(this.db);

		await db.query(
			qb.sql`UPDATE notes SET ${qb.values({ ...formatNoteMeta(meta), ...(updatedAt !== undefined ? { updated_at: updatedAt } : {}) })}
				WHERE workspace_id=${this.workspace} AND id IN (${qb.values(ids)})`,
		);
	}
}
