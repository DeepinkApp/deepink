import { SQLiteMigration } from './types';

/**
 * Convert import from .sql file to a migration that run the SQL queries in transaction
 *
 * Transaction is automatically commit on success and roll back on error
 * @returns
 */
export async function convertSQLToMigrationObject(
	uid: string,
	module: Promise<typeof import('*.sql')>,
): Promise<SQLiteMigration> {
	const { default: sql } = await module;

	return {
		uid,
		apply: async ({ context: { db } }) => {
			try {
				await db.query(`BEGIN TRANSACTION;\n\n${sql}\n\nCOMMIT;`);
			} catch (error) {
				try {
					await db.query('ROLLBACK;');
				} catch (error) {
					console.error(error);
				}

				throw error;
			}
		},
	};
}

export const getMigrationsList = async (): Promise<SQLiteMigration[]> =>
	Promise.all([
		convertSQLToMigrationObject('1_init_db', import('./sql/1_init_db.sql')),
		convertSQLToMigrationObject(
			'2_add_pinned_to_notes',
			import('./sql/2_add_pinned_to_notes.sql'),
		),
	]);
