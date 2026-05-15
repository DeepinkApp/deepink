import { createFileControllerMock } from '@utils/mocks/fileControllerMock';
import { wait } from '@utils/time';

import { openSQLite } from './openSQLite';
import { SQLiteDatabase } from './SQLiteDatabase';
import { qb } from './utils/query-builder';
import { wrapSQLite } from './utils/wrapDB';

test('Custom functions must survive the export', async () => {
	const db = await openSQLite(createFileControllerMock());
	onTestFinished(() => db.close());

	await expect(db.get().query(`SELECT now() as now`)).resolves.toEqual([
		{ now: expect.any(String) },
	]);

	await expect(db.get().query(`SELECT timestamp('now') as time`)).resolves.toEqual([
		{ time: expect.any(Number) },
	]);
	await expect(
		db.get().query(`SELECT timestamp('10/10/2000') as time`),
	).resolves.toEqual([
		{
			// That is good example of a time problem. Time depends on a time zone,
			// so result will be `971128800000` for Berlin time zone,
			// or `971136000000` for America time zone
			time: new Date('10/10/2000').getTime(),
		},
	]);

	await expect(db.get().query(`SELECT gen_random_uuid() as uuid`)).resolves.toEqual([
		{ uuid: expect.any(String) },
	]);

	await db.get().export();
	await expect(db.get().query(`SELECT gen_random_uuid() as uuid`)).resolves.toEqual([
		{ uuid: expect.any(String) },
	]);

	await db.sync();
	await expect(db.get().query(`SELECT gen_random_uuid() as uuid`)).resolves.toEqual([
		{ uuid: expect.any(String) },
	]);
});

test('Exceptions in callbacks must be ignored', async () => {
	const db = new SQLiteDatabase();
	onTestFinished(() => db.close());

	db.onChange(() => {
		throw new Error('listener failed');
	});

	await db.query('CREATE TABLE t (id INTEGER)');
	await expect(db.query('INSERT INTO t (id) VALUES (1)')).resolves.toEqual([]);
});

describe('SQLite Database persistence', () => {
	const file = createFileControllerMock();

	test('Fill the data', async () => {
		const db = await openSQLite(file);
		onTestFinished(() => db.close());

		const wrappedDb = wrapSQLite(db.get());

		await expect(
			wrappedDb.query(qb.sql`INSERT INTO workspaces(name) VALUES('foo')`),
		).resolves.toEqual([]);

		await expect(
			wrappedDb.query(qb.sql`INSERT INTO workspaces(name) VALUES('bar')`),
		).resolves.toEqual([]);

		await expect(wrappedDb.query(qb.sql`SELECT * FROM workspaces`)).resolves.toEqual([
			{ name: 'foo', id: expect.any(String) },
			{ name: 'bar', id: expect.any(String) },
		]);
	});

	test('Use data from previous session', async () => {
		const db = await openSQLite(file);
		onTestFinished(() => db.close());

		const wrappedDb = wrapSQLite(db.get());
		await expect(wrappedDb.query(qb.sql`SELECT * FROM workspaces`)).resolves.toEqual([
			{ name: 'foo', id: expect.any(String) },
			{ name: 'bar', id: expect.any(String) },
		]);
	});
});

describe('SQLite Database transactions', () => {
	describe('Manual transaction management', () => {
		test('Queries in transaction runs sequentially, other queries waits', async () => {
			const db = new SQLiteDatabase();
			onTestFinished(() => db.close());

			await db.query('CREATE TABLE numbers(num INTEGER)');
			await expect(db.query('SELECT num FROM numbers')).resolves.toEqual([]);

			const tx = await db.transaction();
			await tx.query('INSERT INTO numbers(num) VALUES (1),(2)');
			const nonTxPromise = db.query('INSERT INTO numbers(num) VALUES (100)');
			await tx.query('INSERT INTO numbers(num) VALUES (3)');
			await tx.query('INSERT INTO numbers(num) VALUES (4),(5)');
			await tx.close();

			await expect(nonTxPromise).resolves.toEqual([]);

			await expect(
				db
					.query('SELECT num FROM numbers ORDER BY rowid ASC')
					.then((rows) => rows.map(({ num }) => num)),
			).resolves.toEqual([1, 2, 3, 4, 5, 100]);
		});

		test('Transaction methods throws once the transaction is closed', async () => {
			const db = new SQLiteDatabase();
			onTestFinished(() => db.close());

			const tx = await db.transaction();
			await expect(tx.query('SELECT now() as now')).resolves.toEqual([
				{ now: expect.any(String) },
			]);
			await tx.close();

			await expect(tx.query('SELECT now() as now')).rejects.toThrow('completed');
			await expect(tx.close()).rejects.toThrow('completed');
		});
	});

	describe('Auto transaction management', () => {
		test('Queries in transaction runs sequentially, other queries waits', async () => {
			const db = new SQLiteDatabase();
			onTestFinished(() => db.close());

			await db.query('CREATE TABLE numbers(num INTEGER)');
			await expect(db.query('SELECT num FROM numbers')).resolves.toEqual([]);

			let nonTxPromise;
			await db.transaction(async (tx) => {
				await tx.query('INSERT INTO numbers(num) VALUES (1),(2)');
				nonTxPromise = db.query('INSERT INTO numbers(num) VALUES (100)');
				await tx.query('INSERT INTO numbers(num) VALUES (3)');
				await tx.query('INSERT INTO numbers(num) VALUES (4),(5)');
			});

			await expect(nonTxPromise).resolves.toEqual([]);

			await expect(
				db
					.query('SELECT num FROM numbers ORDER BY rowid ASC')
					.then((rows) => rows.map(({ num }) => num)),
			).resolves.toEqual([1, 2, 3, 4, 5, 100]);
		});

		test('Transactions and queries waits for active transaction', async () => {
			const db = new SQLiteDatabase();
			onTestFinished(() => db.close());

			await db.query('CREATE TABLE numbers(num INTEGER)');
			await expect(db.query('SELECT num FROM numbers')).resolves.toEqual([]);

			const tx1 = db.transaction(async (tx) => {
				await tx.query('INSERT INTO numbers(num) VALUES (1),(2)');
				await tx.query('INSERT INTO numbers(num) VALUES (3)');
				await wait(100);
			});

			const tx2 = db.transaction(async (tx) => {
				await tx.query('INSERT INTO numbers(num) VALUES (4),(5)');
				await tx.query('INSERT INTO numbers(num) VALUES (6)');
			});

			const nonTxPromise = db.query('INSERT INTO numbers(num) VALUES (100)');

			await expect(tx1).resolves.toEqual(undefined);
			await expect(tx2).resolves.toEqual(undefined);
			await expect(nonTxPromise).resolves.toEqual([]);

			await expect(
				db
					.query('SELECT num FROM numbers ORDER BY rowid ASC')
					.then((rows) => rows.map(({ num }) => num)),
			).resolves.toEqual([1, 2, 3, 4, 5, 6, 100]);
		});

		test('Transactions returns value', async () => {
			const db = new SQLiteDatabase();
			onTestFinished(() => db.close());

			await db.query('CREATE TABLE numbers(num INTEGER)');
			await expect(db.query('SELECT num FROM numbers')).resolves.toEqual([]);

			await expect(
				db.transaction(async (tx) => {
					await tx.query('INSERT INTO numbers(num) VALUES (1),(2)');
					return tx.query('INSERT INTO numbers(num) VALUES (3) returning num');
				}),
			).resolves.toEqual([{ num: 3 }]);
		});

		test('Error in transaction closes the transaction', async () => {
			const db = new SQLiteDatabase();
			onTestFinished(() => db.close());

			await db.query('CREATE TABLE numbers(num INTEGER)');
			await expect(db.query('SELECT num FROM numbers')).resolves.toEqual([]);

			await expect(
				db.transaction(async () => {
					throw new Error('Test error');
				}),
			).rejects.toThrow('Test error');

			await expect(db.query('SELECT now() as now')).resolves.toEqual([
				{ now: expect.any(String) },
			]);
		});
	});
});
