/* eslint-disable camelcase */
import { createEvent } from 'effector';
import { Query } from 'nano-queries';
import { z } from 'zod';
import { SQLiteDB } from '@core/database/sqlite';
import { DBTypes, qb } from '@core/database/sqlite/utils/query-builder';
import { wrapSQLite } from '@core/database/sqlite/utils/wrapDB';

import tagsQuery from './selectTagsWithResolvedNames.sql';
import { IResolvedTag, ITag } from '..';

type ChangeEvent = 'tags' | 'noteTags';

export enum TAG_ERROR_CODE {
	DUPLICATE = 'Duplicate',
	INVALID_FORMAT = 'InvalidFormat',
	PARENT_TAG_NOT_EXIST = 'ParentTagNotExist',
}

export class TagControllerError extends Error {
	constructor(
		message: string,
		public readonly code: TAG_ERROR_CODE,
	) {
		super(message);
		this.name = 'TagControllerError';
	}
}

export const validateTagName = (name: string) => {
	if (name.split('/').some((t) => t.trim().length === 0)) {
		throw new TagControllerError(
			'Tag name must not be empty',
			TAG_ERROR_CODE.INVALID_FORMAT,
		);
	}
	if (name.startsWith('/') || name.endsWith('/')) {
		throw new TagControllerError(
			'Tag name must not start or end with a slash "/"',
			TAG_ERROR_CODE.INVALID_FORMAT,
		);
	}
	if (name.includes('//')) {
		throw new TagControllerError(
			'Tag name must not contain consecutive slashes "//"',
			TAG_ERROR_CODE.INVALID_FORMAT,
		);
	}
};

/**
 * Returns a query for retrieving resolved tags in the specified workspace
 */
export const selectResolvedTags = (
	workspaceId: string,
	options: {
		/**
		 * Additional conditions for the WHERE clause, joined with `AND` if multiple
		 */
		where?: Query<DBTypes>[];
		order?: Query<DBTypes>;
		/**
		 * The maximum number of rows to return
		 */
		limit?: number;
	} = {},
) => {
	const { where, order, limit } = options;

	return qb.line(
		qb.sql`SELECT * FROM (${qb.raw(tagsQuery)})`,
		qb
			.where(qb.sql`workspace_id = ${workspaceId}`)
			.and(
				where &&
					qb.line(
						...where.map((query, index) =>
							index === 0 ? query : qb.sql`AND ${query}`,
						),
					),
			),
		order && qb.sql`ORDER BY ${order}`,
		limit && qb.limit(limit),
	);
};

const RowScheme = z
	.object({
		id: z.string(),
		name: z.string(),
		resolved_name: z.string(),
		parent: z.string().nullable(),
	})
	.transform(({ resolved_name, ...props }) => ({
		...props,
		resolvedName: resolved_name,
	}));

export class TagsController {
	private readonly db;
	private readonly workspace;
	private readonly onChanged;

	constructor(db: SQLiteDB, workspace: string) {
		this.db = db;
		this.workspace = workspace;
		this.onChanged = createEvent<ChangeEvent>();
	}

	public onChange(event: (scope: ChangeEvent) => void) {
		const subscription = this.onChanged.watch(event);
		return () => subscription.unsubscribe();
	}

	/**
	 * Returns tags list.
	 */
	public async getTags({ resolvedName }: { resolvedName?: string } = {}): Promise<
		IResolvedTag[]
	> {
		const db = wrapSQLite(this.db);

		const filter = qb.where(qb.sql`workspace_id=${this.workspace}`);
		if (resolvedName !== undefined) {
			filter.and(qb.sql`resolved_name=${resolvedName}`);
		}

		const rows = await db.query(
			qb.line(
				qb.raw(tagsQuery),
				qb.sql`JOIN (SELECT id, rowid FROM tags) s ON t.id = s.id ${filter} ORDER BY s.rowid`,
			),
			RowScheme,
		);

		return rows;
	}

	public async add(
		name: string,
		parent: null | string,
		options: { returnIfExist?: boolean } = {},
	): Promise<string> {
		validateTagName(name);

		let lastId: string | null = null;

		return this.db.transaction(async (tx) => {
			const db = wrapSQLite(tx);

			let resolvedTagName: string;
			if (!parent) {
				resolvedTagName = name;
			} else {
				// find parent resolved name
				const [parentTag] = await db.query(
					selectResolvedTags(this.workspace, {
						where: [qb.sql`id = ${parent}`],
						limit: 1,
					}),
					RowScheme,
				);

				// If the parent tag is not found in the database, the tag cannot be created
				if (!parentTag)
					throw new TagControllerError(
						`Parent tag ${parent} does not exist`,
						TAG_ERROR_CODE.PARENT_TAG_NOT_EXIST,
					);

				resolvedTagName = `${parentTag.resolvedName}/${name}`;
			}

			// Check tag uniqueness
			const [duplicateTag] = await db.query(
				selectResolvedTags(this.workspace, {
					where: [qb.sql`resolved_name = ${resolvedTagName}`],
					limit: 1,
				}),
				RowScheme,
			);
			if (duplicateTag) {
				if (options.returnIfExist) return duplicateTag.id;
				throw new TagControllerError(
					`Tag ${duplicateTag.resolvedName} already exists`,
					TAG_ERROR_CODE.DUPLICATE,
				);
			}

			const resolvedTagSegments = resolvedTagName.split('/');

			// Build an array of all path variants to find existing tags that match exactly this one
			// 'foo/bar/baz' - ['foo', 'foo/bar', 'foo/bar/baz']
			// The found tag allows detecting non-existing segments from resolvedTagSegments and creating only those
			const resolvedTagVariants = resolvedTagSegments.map((_, index, segments) =>
				segments.slice(0, index + 1).join('/'),
			);
			const [rootTag] = await db.query(
				selectResolvedTags(this.workspace, {
					where: [qb.sql`resolved_name IN (${qb.values(resolvedTagVariants)})`],
					order: qb.sql`LENGTH(resolved_name) DESC`,
					limit: 1,
				}),
				RowScheme,
			);

			// If parent was provided, at least one existing segment root must be found
			if (!rootTag && parent !== null)
				throw new Error('Parent tag provided but root tag not founded');

			// For newly created tags with no root or parent yet, parentTagId is set to null
			const parentTagId = rootTag ? rootTag.id : null;
			const segmentsForCreation = rootTag
				? resolvedTagSegments.slice(rootTag.resolvedName.split('/').length)
				: resolvedTagSegments;

			for (let idx = 0; idx < segmentsForCreation.length; idx++) {
				const segmentName = segmentsForCreation[idx];
				const segmentParent = idx === 0 ? parentTagId : lastId;

				// SQLite 3.35+ supports RETURNING
				const [newTag] = await db.query(
					qb.sql`INSERT INTO tags (workspace_id, name, parent_id) VALUES (${qb.values(
						[this.workspace, segmentName, segmentParent],
					)}) RETURNING id`,
					z.object({ id: z.string() }),
				);

				lastId = newTag.id as string | null;
			}

			if (!lastId) {
				throw new Error("Can't get id of inserted row");
			}

			this.onChanged('tags');
			return lastId;
		});
	}

	public async update({ name, parent, id }: ITag): Promise<void> {
		if (name.trim().length === 0) {
			throw new TagControllerError(
				'Invalid tag name for update: empty name',
				TAG_ERROR_CODE.INVALID_FORMAT,
			);
		}
		if (name.includes('/')) {
			throw new TagControllerError(
				"Invalid tag name for update: name contain '/'",
				TAG_ERROR_CODE.INVALID_FORMAT,
			);
		}

		const db = wrapSQLite(this.db);

		if (parent) {
			const [{ count }] = await db.query(
				qb.sql`SELECT COUNT(*) as count FROM tags WHERE name=${name} and parent_id=${parent} AND workspace_id=${this.workspace}`,
				z.object({ count: z.number() }),
			);

			if (count > 0)
				throw new TagControllerError(
					`Tag name with that name is already exist`,
					TAG_ERROR_CODE.DUPLICATE,
				);
		}

		await db.query(
			qb.sql`UPDATE tags SET name=${name}, parent_id=${parent} WHERE id=${id} AND workspace_id=${this.workspace}`,
		);

		this.onChanged('tags');
	}

	public async delete(id: string): Promise<void> {
		const db = wrapSQLite(this.db);

		// Recursive CTE to collect all descendant tag IDs
		const tagsIdForRemove = await db.query(
			qb.sql`WITH RECURSIVE tagTree AS (
				SELECT id, parent_id, name, id AS root
				FROM tags
				WHERE id = ${id}
			  UNION ALL
				SELECT t.id, t.parent_id, t.name, t2.root
				FROM tags t
				INNER JOIN tagTree t2 ON t.parent_id = t2.id
			)
			SELECT id FROM tagTree WHERE root IN (${id}) GROUP BY id`,
			z.object({ id: z.string() }).transform((row) => row.id),
		);

		await db.query(
			qb.sql`DELETE FROM tags WHERE workspace_id=${
				this.workspace
			} AND id IN (${qb.values(tagsIdForRemove)})`,
		);
		await db.query(
			qb.sql`DELETE FROM note_tags WHERE workspace_id=${
				this.workspace
			} AND tag_id IN (${qb.values(tagsIdForRemove)})`,
		);

		this.onChanged('tags');
	}

	/**
	 * Returns tags attached to an entity
	 */
	public async getAttachedTags(noteId: string): Promise<IResolvedTag[]> {
		const db = wrapSQLite(this.db);

		const rows = await db.query(
			qb.line(
				qb.raw(tagsQuery),
				qb.sql`WHERE t.id IN (
					SELECT tag_id FROM note_tags
					WHERE workspace_id=${this.workspace} AND note_id=${noteId}
				)`,
			),
			RowScheme,
		);

		return rows;
	}

	public async setAttachedTags(noteId: string, tags: string[]): Promise<void> {
		await this.setAttachedTagsInTransaction([{ noteId, tags }]);
	}

	public async setAttachedTagsInTransaction(
		attachments: {
			noteId: string;
			tags: string[];
		}[],
	) {
		if (attachments.length === 0) return;

		this.db.transaction(async (tx) => {
			const db = wrapSQLite(tx);
			await db.query(qb.sql`BEGIN`);
			try {
				await db.query(
					qb.sql`DELETE FROM note_tags WHERE workspace_id=${this.workspace} AND note_id IN ${qb.values(attachments.map((info) => info.noteId)).withParenthesis()}`,
				);

				const values = attachments
					.map(({ noteId, tags }) =>
						Array.from(new Set(tags)).map(
							(tagId) => qb.sql`(${this.workspace}, ${tagId}, ${noteId})`,
						),
					)
					.flat();

				if (values.length > 0) {
					await db.query(
						qb.sql`INSERT INTO note_tags(workspace_id,tag_id,note_id)
							VALUES ${qb.set(values)}`,
					);
				}

				await db.query(qb.sql`COMMIT`);
			} catch (error) {
				await db.query(qb.sql`ROLLBACK`);
				throw error;
			}
		});

		this.onChanged('noteTags');
	}
}
