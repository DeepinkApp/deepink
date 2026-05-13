import { proxy, transfer, wrap } from 'comlink';
import { BindParams, UpdateHookCallback } from 'sql.js';

import { SQLiteDB, SQLiteDBWorker, SQLiteTransaction } from '.';

export class SQLiteDatabaseWorker implements SQLiteDB {
	protected db;
	protected worker;
	protected isClosed = false;
	constructor(data?: ArrayBuffer | null) {
		this.worker = new Worker(
			/* webpackChunkName: "SQLiteDatabase.worker" */ new URL(
				'./SQLiteDatabase.worker',
				import.meta.url,
			),
			{ type: 'module' },
		);

		const db = wrap<SQLiteDBWorker>(this.worker);
		this.db = db
			.init(data ? transfer(new Uint8Array(data), [data]) : undefined)
			.then(() => db);
	}

	protected async getDb() {
		if (this.isClosed) throw new Error('Database is closed');
		return this.db;
	}

	async query(query: string, params?: BindParams) {
		const db = await this.getDb();
		return db.query(query, params);
	}

	transaction<T extends unknown>(
		cb: (tx: SQLiteTransaction) => Promise<T>,
	): Promise<void>;
	async transaction(): Promise<SQLiteTransaction>;
	async transaction(
		callback?: (tx: SQLiteTransaction) => Promise<unknown>,
	): Promise<any> {
		const db = await this.getDb();
		return callback
			? (db.transaction as unknown as SQLiteDB['transaction'])(proxy(callback))
			: db.transaction();
	}

	async export() {
		const db = await this.getDb();
		return db.export();
	}

	async close() {
		const db = await this.getDb();

		// Reject new requests
		this.isClosed = true;

		// Terminate connection
		await db.close();
		this.worker.terminate();
	}

	onChange(callback: UpdateHookCallback): () => void {
		let isUnsubscribed = false;
		let cleanupPromise: Promise<() => void> | null = null;

		this.db.then((db) => {
			if (isUnsubscribed) return;

			cleanupPromise = db.onChange(proxy(callback));
		});

		return () => {
			isUnsubscribed = true;
			if (cleanupPromise) cleanupPromise.then((cleanup) => cleanup());
		};
	}
}
