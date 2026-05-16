import { z } from 'zod';
import { SQLiteDB } from '@core/database/sqlite';
import { qb } from '@core/database/sqlite/utils/query-builder';
import { wrapSQLite } from '@core/database/sqlite/utils/wrapDB';

const workspaceType = z.object({
	id: z.string(),
	name: z.string(),
});

export class WorkspacesController {
	private readonly db;
	constructor(db: SQLiteDB) {
		this.db = db;
	}

	public async create({ name }: { name: string }) {
		const db = wrapSQLite(this.db);

		const [{ id }] = await db.query(
			qb.sql`INSERT INTO workspaces ("name") VALUES (${name}) RETURNING id`,
			z.object({ id: z.string() }),
		);

		return id;
	}

	public async get(id: string) {
		const db = wrapSQLite(this.db);

		const [info] = await db.query(
			qb.sql`SELECT * FROM workspaces WHERE id=${id} ORDER BY rowid`,
			workspaceType,
		);

		return info ?? null;
	}

	public async update(id: string, options: { name?: string }) {
		const db = wrapSQLite(this.db);

		if (Object.values(options).length === 0) return;

		await db.query(
			qb.line(
				'UPDATE workspaces SET',
				qb.values(options),
				qb.where(qb.values({ id })),
			),
		);
	}

	public async getList() {
		const db = wrapSQLite(this.db);

		return await db.query(qb.sql`SELECT * FROM workspaces`, workspaceType);
	}

	public async delete(ids: string[]) {
		const db = wrapSQLite(this.db);

		await db.query(
			qb.sql`DELETE FROM workspaces WHERE id IN (${qb.values(ids)})`,
			workspaceType,
		);
	}
}
