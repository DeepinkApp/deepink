import { vol } from 'memfs';
import { getRandomBytes } from '@core/encryption/utils/random';

import { enableStorage } from './main';
import { storageApi } from './renderer';

vi.mock('fs', () => vi.importActual('@mocks/fs'));
vi.mock('fs/promises', () => vi.importActual('@mocks/fs/promises'));
vi.mock('recursive-readdir', () => vi.importActual('@mocks/recursive-readdir'));
vi.mock('electron', () => vi.importActual('@mocks/electron'));

describe('Upload sessions', () => {
	let cleanups = [] as (() => void)[];
	beforeEach(() => {
		vol.reset();
		cleanups.push(enableStorage());
	});
	afterEach(() => {
		cleanups.forEach((cleanup) => cleanup());
		cleanups = [];
	});

	test('File can be loaded with session', async () => {
		const session = await storageApi.createUploadSession('filename', '/foo/bar');

		await storageApi.uploadChunk(session, getRandomBytes(1024).buffer);
		await storageApi.uploadChunk(session, getRandomBytes(1024).buffer);
		await storageApi.uploadChunk(session, getRandomBytes(1024).buffer);

		await storageApi.commitUpload(session);

		expect(
			vol.readFileSync('/home/userData/appDir/app/foo/bar/filename'),
		).toHaveLength(1024 * 3);
	});

	test('Creation of new session for the same path must cancel previous session', async () => {
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
