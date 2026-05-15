import { Query } from 'nano-queries';
import { z } from 'zod';

import { DBTypes, qb } from './query-builder';
import { SQLiteDB, SQLiteTransaction } from '..';

type WrappedDbMethods = {
	query: <S extends z.ZodType>(
		query: Query<DBTypes>,
		scheme?: S,
	) => Promise<z.TypeOf<S>[]>;
};
export const wrapSQLite = (db: SQLiteDB | SQLiteTransaction): WrappedDbMethods => {
	return new Proxy<any>(
		{},
		{
			get(_target, _propertyName: keyof WrappedDbMethods) {
				return async (query: Query, scheme?: z.ZodType) => {
					const { sql, bindings } = qb.toSQL(query);
					try {
						const result = await db.query(sql, bindings);
						// console.log("DBG", result.rows);

						if (scheme) {
							return scheme.array().parse(result);
						}

						return result;
					} catch (error) {
						console.error('SQL query', sql);
						throw error;
					}
				};
			},
		},
	);
};
