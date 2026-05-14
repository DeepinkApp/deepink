/* eslint-disable camelcase */
import { z } from 'zod';
import { SQLiteDB } from '@core/database/sqlite';
import { qb } from '@core/database/sqlite/utils/query-builder';
import { wrapSQLite } from '@core/database/sqlite/utils/wrapDB';

import { rename } from './rename';

const NoteVersionRowScheme = z.object({
	id: z.string(),
	note_id: z.string(),
	created_at: z.number(),
	title: z.string(),
	text: z.string(),
});

const NoteVersionMapScheme = NoteVersionRowScheme.omit({ note_id: true }).transform(
	rename({ created_at: 'createdAt' } as const),
);

export type NoteVersion = z.TypeOf<typeof NoteVersionMapScheme>;

export class NoteVersions {
	constructor(
		private readonly db: SQLiteDB,
		private readonly workspace: string,
	) {}

	/**
	 * Create note snapshot. Snapshot contains a latest note data.
	 *
	 * In case a most recent snapshot is match latest note data, snapshot will not be created.
	 * Use option `force` to control this behaviour.
	 *
	 * @deprecated use `batchSnapshot` instead
	 */
	public async snapshot(
		noteId: string,
		options: {
			/**
			 * Force snapshot creation.
			 *
			 * Creates snapshot even if most recent snapshot match latest note data
			 */
			force?: boolean;
		} = {},
	) {
		await this.batchSnapshot([noteId], options);
	}

	// TODO: migrate code from `snapshot` method and rename back to `snapshot`
	/**
	 * Create note snapshot. Snapshot contains a latest note data.
	 *
	 * In case a most recent snapshot is match latest note data, snapshot will not be created.
	 * Use option `force` to control this behaviour.
	 */
	public async batchSnapshot(
		noteIds: string[],
		options: {
			/**
			 * Force snapshot creation.
			 *
			 * Creates snapshot even if most recent snapshot match latest note data
			 */
			force?: boolean;
		} = {},
	) {
		const db = wrapSQLite(this.db);

		if (options.force) {
			await db.query(
				qb.sql`
					INSERT INTO note_versions (note_id, created_at, title, text)
					SELECT
						id as note_id, 
						${Date.now()} as created_at,
						title,
						text
					FROM notes
					WHERE id IN (${qb.values(noteIds)}) AND workspace_id = ${this.workspace}
				`,
			);

			return;
		}

		await db.query(
			qb.sql`
				INSERT INTO note_versions (note_id, created_at, title, text)
				SELECT
					id as note_id,
					${Date.now()} as created_at,
					n.title,
					n.text
				FROM notes n
				LEFT JOIN (
					SELECT v.title, v.text, v.note_id
					FROM note_versions v
					-- Order by monotonic "rowid" in case of timestamp collisions
					ORDER BY v.created_at DESC, rowid DESC
					LIMIT 1
				) last ON last.note_id = n.id
				WHERE
					n.id IN (${qb.values(noteIds)}) AND workspace_id = ${this.workspace}
					AND (last.note_id IS NULL OR last.title != n.title OR last.text != n.text)
			`,
		);
	}

	public async getList(noteId: string) {
		const db = wrapSQLite(this.db);

		return await db.query(
			// Order by monotonic "rowid" in case of timestamp collisions
			qb.sql`SELECT * FROM note_versions WHERE note_id = ${noteId} ORDER BY created_at DESC, rowid DESC`,
			NoteVersionMapScheme,
		);
	}

	public async get(versionId: string) {
		const db = wrapSQLite(this.db);

		const [version] = await db.query(
			qb.sql`SELECT * FROM note_versions WHERE id = ${versionId} LIMIT 1`,
			NoteVersionMapScheme,
		);

		return version ?? null;
	}

	public async delete(versionIds: string[]) {
		const db = wrapSQLite(this.db);
		await db.query(
			qb.sql`DELETE FROM note_versions WHERE id IN (${qb.values(versionIds)})`,
		);
	}

	public async purge(noteIds: string[]) {
		const db = wrapSQLite(this.db);
		await db.query(
			qb.sql`DELETE FROM note_versions WHERE note_id IN (${qb.values(noteIds)})`,
		);
	}
}
