import { vol } from 'memfs';
import { getRandomBytes } from '@core/encryption/utils/random';
import { readdir } from '@tests/utils/fs';

import { enableStorage } from './main';
import { storageApi } from './renderer';

vi.mock('fs', () => vi.importActual('@mocks/fs'));
vi.mock('fs/promises', () => vi.importActual('@mocks/fs/promises'));
vi.mock('electron', () => vi.importActual('@mocks/electron'));

describe('Special names', () => {
	beforeEach(() => {
		vol.reset();
	});

	test('File name with special prefix cannot be created', async () => {
		onTestFinished(enableStorage({ tmpPrefix: '.tmp' }));

		await expect(storageApi.createUploadSession('.tmp', '/foo/bar')).rejects.toThrow(
			"File name must not start from '.tmp'",
		);

		await expect(
			storageApi.createUploadSession('foo/bar/.tmp', '/foo/bar'),
		).rejects.toThrow("File name must not start from '.tmp'");

		await expect(
			storageApi.createUploadSession('foo/bar/.tmp-bkp', '/foo/bar'),
		).rejects.toThrow("File name must not start from '.tmp'");
	});

	test('Files with special name is unavailable', async () => {
		onTestFinished(enableStorage({ tmpPrefix: '.tmp' }));

		// Start uploading session
		const session = await storageApi.createUploadSession('filename', '/foo/bar');
		await storageApi.uploadChunk(session, getRandomBytes(1024).buffer);

		// Temp file is present in FS
		expect(readdir('/')).toContain(
			'/home/userData/appDir/app/foo/bar/.tmp-tmp-filename',
		);

		await expect(storageApi.list('/')).resolves.toEqual([]);
		await expect(
			storageApi.createReadSession('.tmp-tmp-filename', '/foo/bar'),
		).resolves.toBe(null);

		// Deletion does not work
		await expect(
			storageApi.delete(['.tmp-tmp-filename'], '/foo/bar'),
		).resolves.toBeUndefined();
		expect(readdir('/')).toContain(
			'/home/userData/appDir/app/foo/bar/.tmp-tmp-filename',
		);
	});
});

describe('Upload sessions', () => {
	beforeEach(() => {
		vol.reset();
	});

	test('File can be loaded with session', async () => {
		onTestFinished(enableStorage());

		const session = await storageApi.createUploadSession('filename', '/foo/bar');

		await storageApi.uploadChunk(session, getRandomBytes(1024).buffer);
		await storageApi.uploadChunk(session, getRandomBytes(1024).buffer);
		await storageApi.uploadChunk(session, getRandomBytes(1024).buffer);

		await storageApi.commitUpload(session);

		expect(
			vol.readFileSync('/home/userData/appDir/app/foo/bar/filename'),
		).toHaveLength(1024 * 3);
	});

	test('Session cannot be re-used', async () => {
		onTestFinished(enableStorage());

		const session = await storageApi.createUploadSession('filename', '/foo/bar');
		await storageApi.uploadChunk(session, getRandomBytes(1024).buffer);
		await storageApi.commitUpload(session);

		expect(
			vol.readFileSync('/home/userData/appDir/app/foo/bar/filename'),
		).toHaveLength(1024);

		await expect(
			storageApi.uploadChunk(session, getRandomBytes(1024).buffer),
		).rejects.toThrow('No session found');
		await expect(storageApi.commitUpload(session)).rejects.toThrow(
			'No session found',
		);
	});

	test('File can be changed', async () => {
		onTestFinished(enableStorage());

		// Write
		const session = await storageApi.createUploadSession('filename', '/foo/bar');
		await storageApi.uploadChunk(session, getRandomBytes(1024).buffer);
		await storageApi.uploadChunk(session, getRandomBytes(1024).buffer);
		await storageApi.commitUpload(session);

		expect(
			vol.readFileSync('/home/userData/appDir/app/foo/bar/filename'),
		).toHaveLength(1024 * 2);

		// Write
		const session2 = await storageApi.createUploadSession('filename', '/foo/bar');
		await storageApi.uploadChunk(session2, getRandomBytes(100).buffer);
		await storageApi.uploadChunk(session2, getRandomBytes(100).buffer);
		await storageApi.commitUpload(session2);

		expect(
			vol.readFileSync('/home/userData/appDir/app/foo/bar/filename'),
		).toHaveLength(100 * 2);
	});

	test('Creation of new session for the same path must cancel previous session', async () => {
		onTestFinished(enableStorage());

		const session1 = await storageApi.createUploadSession('filename', '/foo/bar');
		await storageApi.uploadChunk(session1, getRandomBytes(1024).buffer);

		const session2 = await storageApi.createUploadSession('filename', '/foo/bar');
		await expect(
			storageApi.uploadChunk(session1, getRandomBytes(1024).buffer),
		).rejects.toThrow('Another session is started');
		await expect(
			storageApi.uploadChunk(session2, getRandomBytes(1024).buffer),
		).resolves.not.toThrow();

		await expect(storageApi.commitUpload(session1)).rejects.toThrow(
			'Another session is started',
		);
		await expect(storageApi.commitUpload(session2)).resolves.not.toThrow();

		expect(
			vol.readFileSync('/home/userData/appDir/app/foo/bar/filename'),
		).toHaveLength(1024);
	});

	test('Aborted session reasons are retained temporarily, then discarded', async () => {
		vi.useFakeTimers();
		onTestFinished(() => {
			vi.useRealTimers();
		});
		onTestFinished(enableStorage());

		const previousSession = await storageApi.createUploadSession(
			'filename',
			'/foo/bar',
		);
		await storageApi.uploadChunk(previousSession, getRandomBytes(1024).buffer);

		const currentSession = await storageApi.createUploadSession(
			'filename',
			'/foo/bar',
		);
		await storageApi.commitUpload(currentSession);

		await expect(
			storageApi.uploadChunk(previousSession, getRandomBytes(1024).buffer),
		).rejects.toThrow('Another session is started');

		await vi.advanceTimersByTimeAsync(59_000);
		await expect(
			storageApi.uploadChunk(previousSession, getRandomBytes(1024).buffer),
		).rejects.toThrow('Another session is started');

		await vi.advanceTimersByTimeAsync(10_000);

		await expect(
			storageApi.uploadChunk(previousSession, getRandomBytes(1024).buffer),
		).rejects.toThrow('No session found');
	});

	test('No race conditions for sessions', async () => {
		onTestFinished(enableStorage());

		const sessionIds = await Promise.all([
			storageApi.createUploadSession('filename', '/foo/bar'),
			storageApi.createUploadSession('filename', '/foo/bar'),
			storageApi.createUploadSession('filename', '/foo/bar'),
			storageApi.createUploadSession('filename', '/foo/bar'),
			storageApi.createUploadSession('filename', '/foo/bar'),
		]);

		await expect(
			Promise.allSettled(
				sessionIds.map((id) =>
					storageApi.uploadChunk(id, getRandomBytes(100).buffer),
				),
			).then((results) =>
				results.filter((result) => result.status === 'fulfilled'),
			),
		).resolves.toHaveLength(1);
	});

	test('Many sessions may exists in parallel', async () => {
		onTestFinished(enableStorage());

		const session1 = await storageApi.createUploadSession('filename1', '/foo/bar');
		const session2 = await storageApi.createUploadSession('filename2', '/foo/bar');

		await storageApi.uploadChunk(session1, getRandomBytes(1024).buffer);
		await storageApi.uploadChunk(session2, getRandomBytes(1024).buffer);

		await storageApi.uploadChunk(session1, getRandomBytes(1024).buffer);
		await storageApi.uploadChunk(session2, getRandomBytes(1024).buffer);

		await expect(storageApi.commitUpload(session1)).resolves.not.toThrow();
		await expect(storageApi.commitUpload(session2)).resolves.not.toThrow();

		expect(
			vol.readFileSync('/home/userData/appDir/app/foo/bar/filename1'),
		).toHaveLength(1024 * 2);
		expect(
			vol.readFileSync('/home/userData/appDir/app/foo/bar/filename2'),
		).toHaveLength(1024 * 2);
	});
});

describe('File integrity', () => {
	beforeEach(() => {
		vol.reset();
	});

	test('File can be restored from backup', async () => {
		onTestFinished(enableStorage({ tmpPrefix: '.tmp' }));

		const fileContent = getRandomBytes(1024);

		// Create backup file
		vol.mkdirSync('/home/userData/appDir/app/foo/bar', { recursive: true });
		vol.writeFileSync(
			'/home/userData/appDir/app/foo/bar/.tmp-bkp-filename',
			fileContent,
		);

		const session = await storageApi.createReadSession('filename', '/foo/bar');
		expect(session).not.toBe(null);
		await expect(storageApi.readChunk(session!.id, 10_000)).resolves.toStrictEqual(
			fileContent.buffer,
		);
	});

	test('File deletes with all related tmp files', async () => {
		onTestFinished(enableStorage({ tmpPrefix: '.tmp' }));

		const fileContent = getRandomBytes(1024);

		// Create backup file
		vol.mkdirSync('/home/userData/appDir/app/foo/bar', { recursive: true });
		vol.writeFileSync(
			'/home/userData/appDir/app/foo/bar/.tmp-bkp-filename',
			fileContent,
		);
		vol.writeFileSync('/home/userData/appDir/app/foo/bar/filename', fileContent);
		expect(readdir('/')).toContainEqual(expect.stringContaining('filename'));

		await storageApi.delete(['filename'], '/foo/bar');
		expect(readdir('/')).not.toContainEqual(expect.stringContaining('filename'));
	});

	test('Deleting a file removes its backup even when the target is missing', async () => {
		onTestFinished(enableStorage({ tmpPrefix: '.tmp' }));

		const root = '/home/userData/appDir/app/foo/bar';
		const backupPath = `${root}/.tmp-bkp-note`;
		vol.mkdirSync(root, { recursive: true });
		vol.writeFileSync(backupPath, 'deleted content');
		expect(vol.existsSync(`${root}/note`)).toBe(false);
		expect(vol.existsSync(backupPath)).toBe(true);

		await storageApi.delete(['note'], '/foo/bar');

		expect(vol.existsSync(backupPath)).toBe(false);
		await expect(storageApi.createReadSession('note', '/foo/bar')).resolves.toBe(
			null,
		);
	});
});
