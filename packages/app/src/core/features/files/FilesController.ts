import { z } from 'zod';
import { SQLiteDB } from '@core/database/sqlite';
import { qb } from '@core/database/sqlite/utils/query-builder';
import { wrapSQLite } from '@core/database/sqlite/utils/wrapDB';

import { IFilesStorage } from '.';

// TODO: add tests
// TODO: add runtime validation
// TODO: implement interface and use interface instead of class
/**
 * Files manager for local database
 */
export class FilesController {
	constructor(
		protected readonly db: SQLiteDB,
		protected readonly filesStorage: IFilesStorage,
		protected readonly workspace: string,
	) {}

	public async add(file: File) {
		const db = wrapSQLite(this.db);

		// Insert in DB
		const [{ id: fileId }] = await db.query(
			qb.sql`INSERT INTO files (workspace_id,name,mimetype) VALUES (${this.workspace},${file.name},${file.type}) RETURNING id`,
			z.object({ id: z.string() }),
		);

		// TODO: delete entry in DB if can't upload file. Or try to upload first and then add file to DB
		// Write file
		const buffer = await file.arrayBuffer();
		await this.filesStorage.write(fileId, buffer);

		return fileId;
	}

	public async get(fileId: string) {
		const db = wrapSQLite(this.db);

		// Insert in DB
		const [fileEntry] = await db.query(
			qb.sql`SELECT * FROM files WHERE workspace_id=${this.workspace} AND id=${fileId}`,

			z.object({
				name: z.string(),
				mimetype: z.string(),
			}),
		);
		if (!fileEntry) return null;

		const { name, mimetype } = fileEntry;

		const buffer = await this.filesStorage.get(fileId);
		if (!buffer) return null;

		return new File([buffer], name, { type: mimetype });
	}

	// TODO: remove attached files
	public async delete(filesId: string[]) {
		const db = wrapSQLite(this.db);

		if (filesId.length === 0) return;

		// Delete in database
		await db.query(
			qb.sql`DELETE FROM files WHERE workspace_id=${
				this.workspace
			} AND id IN (${qb.values(filesId)})`,
		);

		// Delete files
		await this.filesStorage.delete(filesId);
	}

	public async query() {
		const db = wrapSQLite(this.db);

		return await db.query(
			qb.sql`SELECT id, name, mimetype FROM files WHERE workspace_id=${this.workspace}`,
			z.object({
				id: z.string(),
				name: z.string(),
				mimetype: z.string(),
			}),
		);
	}
}
