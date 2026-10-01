import { vol } from 'memfs';
import { getRandomBytes } from '@core/encryption/utils/random';

import { enableStorage } from './main';
import { storageApi } from './renderer';

vi.mock('fs', () => vi.importActual('@mocks/fs'));
vi.mock('fs/promises', () => vi.importActual('@mocks/fs/promises'));
vi.mock('recursive-readdir', () => vi.importActual('@mocks/recursive-readdir'));
vi.mock('electron', () => vi.importActual('@mocks/electron'));

describe('Special names', () => {
	beforeEach(() => {
		vol.reset();
	});

	test('File name with special prefix cannot be created', async () => {
		onTestFinished(enableStorage({ tmpPrefix: '.tmp' }));

		await expect(storageApi.createUploadSession('.tmp', '/foo/bar')).rejects.toThrow(
			'File name must not start from ".tmp"',
		);

		await expect(
			storageApi.createUploadSession('foo/bar/.tmp', '/foo/bar'),
		).rejects.toThrow('File name must not start from ".tmp"');

		await expect(
			storageApi.createUploadSession('foo/bar/.tmp-bkp', '/foo/bar'),
		).rejects.toThrow('File name must not start from ".tmp"');
	});

	test('Files with special name is unavailable', async () => {
		onTestFinished(enableStorage({ tmpPrefix: '.tmp' }));

		// Start uploading session
		const session = await storageApi.createUploadSession('filename', '/foo/bar');
		await storageApi.uploadChunk(session, getRandomBytes(1024).buffer);

		// Temp file is present in FS
		expect(vol.readdirSync('/', { recursive: true })).toContain(
			'/home/userData/appDir/app/foo/bar/.tmp-tmp-filename',
		);

		await expect(storageApi.list('/')).resolves.toEqual([]);
		await expect(storageApi.get('.tmp-tmp-filename', '/foo/bar')).resolves.toBe(null);

		// Deletion does not work
		await expect(
			storageApi.delete(['.tmp-tmp-filename'], '/foo/bar'),
		).resolves.toBeUndefined();
		expect(vol.readdirSync('/', { recursive: true })).toContain(
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

		await expect(storageApi.get('filename', '/foo/bar')).resolves.toStrictEqual(
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
		expect(vol.readdirSync('/', { recursive: true })).toContainEqual(
			expect.stringContaining('filename'),
		);

		await storageApi.delete(['filename'], '/foo/bar');
		expect(vol.readdirSync('/', { recursive: true })).not.toContainEqual(
			expect.stringContaining('filename'),
		);
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
		await expect(storageApi.get('note', '/foo/bar')).resolves.toBe(null);
	});
});
