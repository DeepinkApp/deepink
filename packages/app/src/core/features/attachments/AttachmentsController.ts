import { z } from 'zod';
import { SQLiteDB } from '@core/database/sqlite';
import { qb } from '@core/database/sqlite/utils/query-builder';
import { wrapSQLite } from '@core/database/sqlite/utils/wrapDB';

/**
 * attachments manager, to track attachments usage and to keep consistency
 */
export class AttachmentsController {
	constructor(
		private readonly db: SQLiteDB,
		private readonly workspace: string,
	) {}

	public async set(targetId: string, attachments: string[]) {
		const db = wrapSQLite(this.db);

		await db.query(
			qb.sql`DELETE FROM note_files WHERE workspace_id=${this.workspace} AND note_id=${targetId}`,
		);

		if (attachments.length > 0) {
			await db.query(
				qb.sql`INSERT INTO note_files ("workspace_id", "note_id", "file_id") VALUES ${qb.set(
					attachments.map((fileId) =>
						qb.values([this.workspace, targetId, fileId]).withParenthesis(),
					),
				)}`,
			);
		}
	}

	public async get(targetId: string): Promise<string[]> {
		const db = wrapSQLite(this.db);

		return await db.query(
			qb.sql`
				SELECT file_id as file FROM note_files
				WHERE workspace_id=${this.workspace} AND note_id=${targetId}
				ORDER BY rowid
			`,
			z.object({ file: z.string() }).transform((row) => row.file),
		);
	}

	public async delete(resources: string[]) {
		const db = wrapSQLite(this.db);

		if (resources.length === 0) return;

		await db.query(
			qb.sql`DELETE FROM note_files WHERE workspace_id=${
				this.workspace
			} AND file_id IN (${qb.values(resources)})`,
		);
	}

	public async query() {
		const db = wrapSQLite(this.db);

		return await db.query(
			qb.sql`SELECT file_id as file, note_id as note FROM note_files WHERE workspace_id=${this.workspace}`,
			z.object({
				file: z.string(),
				note: z.string(),
			}),
		);
	}
}
