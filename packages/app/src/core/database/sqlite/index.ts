import sqlite, { UpdateHookCallback } from 'sql.js';

export interface SQLiteTransaction {
	query(query: string, params?: sqlite.BindParams): Promise<sqlite.ParamsObject[]>;
	close(): Promise<void>;
}
export interface SQLiteDB {
	query(query: string, params?: sqlite.BindParams): Promise<sqlite.ParamsObject[]>;
	transaction<T extends unknown>(
		cb: (tx: SQLiteTransaction) => Promise<T>,
	): Promise<void>;
	transaction(): Promise<SQLiteTransaction>;
	export(): Promise<Uint8Array>;
	close(): Promise<void>;
	onChange(callback: UpdateHookCallback): () => void;
}

export interface SQLiteDBWorker extends SQLiteDB {
	init(data?: ArrayLike<number> | Buffer | null): Promise<void>;
}
