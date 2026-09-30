import { vol } from 'memfs';
import { getRandomBytes } from '@core/encryption/utils/random';

import { enableStorage } from './main';
import { ElectronFilesController, storageApi } from './renderer';

vi.mock('fs', () => vi.importActual('@mocks/fs'));
vi.mock('fs/promises', () => vi.importActual('@mocks/fs/promises'));
vi.mock('recursive-readdir', () => vi.importActual('@mocks/recursive-readdir'));
vi.mock('electron', () => vi.importActual('@mocks/electron'));

const getBufferFromText = (text: string) => new Uint8Array(Buffer.from(text)).buffer;

const createFiles = (
	files: ElectronFilesController,
	fileNames: string[],
	content?: ArrayBuffer,
) =>
	Promise.all(
		fileNames.map((id) => files.write(id, content ?? new Uint8Array(100).buffer)),
	);

describe('Chunking', () => {
	const cleanups = [] as (() => void)[];
	beforeAll(() => {
		vol.reset();
		cleanups.push(enableStorage());
	});
	afterAll(() => {
		cleanups.forEach((cleanup) => cleanup());
	});

	test.each([
		{ size: 99, chunkSize: 5 },
		{ size: 20, chunkSize: 5 },
		{ size: 5, chunkSize: 5 },
		{ size: 4.9, chunkSize: 5 },
		{ size: 0.1, chunkSize: 5 },
	])(
		'File reading returns exact equal buffer as original data (chunk size $chunkSize Mb, file size $size Mb)',
		async ({ size, chunkSize }) => {
			const filesController = new ElectronFilesController(
				storageApi,
				'size-test',
				undefined,
				{ chunkSize },
			);
			const originalBuffer = getRandomBytes(1024 ** 2 * size);

			await filesController.write('data', originalBuffer.buffer);

			const bytesFromDisk = await filesController.get('data');
			expect(bytesFromDisk).toBeInstanceOf(ArrayBuffer);
			expect(Buffer.from(originalBuffer).equals(Buffer.from(bytesFromDisk!))).toBe(
				true,
			);
		},
	);
});

describe('Basic ops', () => {
	const cleanups = [] as (() => void)[];
	beforeAll(() => {
		cleanups.push(enableStorage());
	});
	afterAll(() => {
		cleanups.forEach((cleanup) => cleanup());
	});
	beforeEach(() => {
		vol.reset();
	});

	test('File uploading persist data on disk', async () => {
		// No files in FS
		expect(vol.readdirSync('/', { recursive: true })).toEqual([]);

		const filesController = new ElectronFilesController(storageApi, 'vaultDir');

		// Write files
		const contentSample = getBufferFromText('File text content');
		await filesController.write('test.txt', contentSample);
		await filesController.write('/foo/bar/baz/test.txt', contentSample);

		// Explore files list
		await expect(filesController.list()).resolves.toMatchSnapshot(
			'Controller files list after writing',
		);

		expect(vol.readdirSync('/', { recursive: true }), 'Explore FS').toMatchSnapshot(
			'FS structure after writing',
		);

		// Explore files content
		await expect(
			filesController.list().then((paths) =>
				Promise.all(
					paths.map((path) =>
						filesController.get(path).then((buffer) => {
							if (!buffer) throw new Error('Buffer not found');
							return {
								path,
								content: Buffer.from(buffer).toString(),
							};
						}),
					),
				),
			),
		).resolves.toMatchSnapshot('Files content');
	});
});

describe('Files paths', () => {
	const cleanups = [] as (() => void)[];
	beforeAll(() => {
		cleanups.push(enableStorage());
	});
	afterAll(() => {
		cleanups.forEach((cleanup) => cleanup());
	});
	beforeEach(() => {
		vol.reset();
	});

	const contentSample = getBufferFromText('File text content');

	test('Files can be fetched by paths with no leading slash', async () => {
		const files = new ElectronFilesController(storageApi, 'vaultDir');
		await createFiles(files, ['test.txt', '/foo/bar/baz/test.txt'], contentSample);

		await expect(files.get('test.txt')).resolves.toStrictEqual(contentSample);
		await expect(files.get('foo/bar/baz/test.txt')).resolves.toStrictEqual(
			contentSample,
		);
	});

	test('Files can be fetched by paths with leading slash', async () => {
		const files = new ElectronFilesController(storageApi, 'vaultDir');
		await createFiles(files, ['test.txt', '/foo/bar/baz/test.txt'], contentSample);

		await expect(files.get('/test.txt')).resolves.toStrictEqual(contentSample);
		await expect(files.get('/foo/bar/baz/test.txt')).resolves.toStrictEqual(
			contentSample,
		);

		await expect(
			files.get('////test.txt'),
			'Leading slash can be repeated',
		).resolves.toStrictEqual(contentSample);
	});

	test('Files can be fetched by relative paths', async () => {
		const files = new ElectronFilesController(storageApi, 'vaultDir');
		await createFiles(files, ['test.txt', '/foo/bar/baz/test.txt'], contentSample);

		await expect(files.get('/foo/../test.txt')).resolves.toStrictEqual(contentSample);
		await expect(files.get('./foo/bar/baz/test.txt')).resolves.toStrictEqual(
			contentSample,
		);
	});
});

describe('Path traversal isolation', () => {
	const cleanups = [] as (() => void)[];
	beforeAll(() => {
		cleanups.push(enableStorage());
	});
	afterAll(() => {
		cleanups.forEach((cleanup) => cleanup());
	});

	const contentSample = getBufferFromText('File text content');
	beforeEach(() => {
		vol.reset();

		vol.mkdirSync('/home/userData/appDir/app/vaultDir', { recursive: true });
		vol.writeFileSync(
			'/home/userData/appDir/app/vaultDir/secret.txt',
			Buffer.from(new Uint8Array(contentSample)),
		);
	});

	test("Client can't traverse out of root directory", async () => {
		const files = new ElectronFilesController(storageApi, 'vaultDir');

		await expect(files.get('../vault2/test.bytes')).rejects.toThrowError(
			'Resolved path is out of root directory',
		);

		await expect(files.get('../secret.txt')).rejects.toThrowError(
			'Resolved path is out of root directory',
		);
	});

	test('Attempt to write content in directory must throws error', async () => {
		const files = new ElectronFilesController(storageApi, 'vaultDir');
		await expect(files.write('/', new ArrayBuffer(1))).rejects.toThrowError(
			"EISDIR: illegal operation on a directory, open '/home/userData/appDir/app/vaultDir'",
		);
	});

	test('File can be accessed inside root directory', async () => {
		const files = new ElectronFilesController(storageApi, 'vaultDir');
		await expect(files.get('./secret.txt')).resolves.toStrictEqual(contentSample);
	});

	test('All ops respects the root limitations', async () => {
		const files = new ElectronFilesController(storageApi, 'vaultDir');

		await expect(files.delete(['../secret.txt'])).rejects.toThrowError(
			'Resolved path is out of root directory',
		);
		await expect(
			files.write('../secret.txt', new Uint8Array().buffer),
		).rejects.toThrowError('Resolved path is out of root directory');

		// Read file out of root directory
		vol.writeFileSync('/home/userData/secret.txt', 'Secret data');
		await expect(files.get('../../secret.txt')).rejects.toThrowError(
			'Resolved path is out of root directory',
		);
	});
});

describe('FS backend', () => {
	beforeAll(() => {
		vol.reset();
	});

	test('When backend is not started - any ops in controller throws error', async () => {
		const filesController = new ElectronFilesController(storageApi, 'vaultDir');

		await expect(filesController.list()).rejects.toThrow(
			'No handler registered for storage.list',
		);
		await expect(filesController.get('/')).rejects.toThrow(
			'No handler registered for storage.get',
		);
		await expect(filesController.write('/', new ArrayBuffer(1))).rejects.toThrow(
			'No handler registered for storage.createUploadSession',
		);
		await expect(filesController.delete(['/'])).rejects.toThrow(
			'No handler registered for storage.delete',
		);

		// Setup handler
		const storageHandlerCleanup = enableStorage();
		onTestFinished(storageHandlerCleanup);

		await expect(filesController.list()).resolves.toStrictEqual([]);

		// Clear handler again
		storageHandlerCleanup();
		await expect(filesController.list()).rejects.toThrow(
			'No handler registered for storage.list',
		);
	});
});

describe('Many clients', () => {
	const cleanups = [] as (() => void)[];
	beforeAll(() => {
		vol.reset();
		cleanups.push(enableStorage());
	});
	afterAll(() => {
		cleanups.forEach((cleanup) => cleanup());
	});

	test('Files is scoped by client root directory', async () => {
		const files1 = new ElectronFilesController(storageApi, 'dir1');
		const files2 = new ElectronFilesController(storageApi, 'dir2');

		// Files list is isolated
		await files1.write('test.bytes', new Uint8Array(1).buffer);

		await expect(files1.list()).resolves.toEqual(['/test.bytes']);
		await expect(files2.list()).resolves.toEqual([]);

		// Each client can have different files with the same name
		await files2.write('test.bytes', new Uint8Array(2).buffer);

		await expect(files1.get('test.bytes')).resolves.toStrictEqual(
			new Uint8Array(1).buffer,
		);
		await expect(files2.get('test.bytes')).resolves.toStrictEqual(
			new Uint8Array(2).buffer,
		);
	});
});

describe('Deletion tests', () => {
	const cleanups = [] as (() => void)[];
	beforeAll(() => {
		cleanups.push(enableStorage());
	});
	afterAll(() => {
		cleanups.forEach((cleanup) => cleanup());
	});

	beforeEach(() => {
		vol.reset();
	});

	test('One file can be deleted', async () => {
		const files = new ElectronFilesController(storageApi, 'deletionTests');
		await createFiles(files, ['/bytes1', '/bytes2', '/bytes3']);

		await expect(files.list()).resolves.toContain('/bytes1');

		await files.delete(['bytes1']);
		await expect(files.list()).resolves.not.toContain('/bytes1');
	});

	test('Few files can be deleted', async () => {
		const files = new ElectronFilesController(storageApi, 'deletionTests');
		await createFiles(files, ['/bytes1', '/bytes2', '/bytes3']);

		await expect(files.list()).resolves.toContain('/bytes2');
		await expect(files.list()).resolves.toContain('/bytes3');

		await files.delete(['bytes2', '/bytes3']);

		await expect(files.list()).resolves.not.toContain('/bytes2');
		await expect(files.list()).resolves.not.toContain('/bytes3');
	});

	test('Directory deletion deletes all its content', async () => {
		const files = new ElectronFilesController(storageApi, 'deletionTests');
		await createFiles(files, ['/foo/bytes1', '/foo/bar/bytes1', '/foo/bar/bytes2']);

		await expect(files.list()).resolves.toContain('/foo/bar/bytes1');
		await expect(files.list()).resolves.toContain('/foo/bar/bytes2');

		await files.delete(['/foo/bar']);
		await expect(files.list()).resolves.not.toContain('/foo/bar/bytes1');
		await expect(files.list()).resolves.not.toContain('/foo/bar/bytes2');

		await expect(files.list()).resolves.toContain('/foo/bytes1');
	});

	test('Root directory may be deleted', async () => {
		const files = new ElectronFilesController(storageApi, 'deletionTests');
		await createFiles(files, ['/foo/bytes1', '/foo/bar/bytes1', '/foo/bar/bytes2']);

		await expect(files.list()).resolves.toHaveLength(3);

		await files.delete(['/']);
		await expect(files.list()).resolves.toHaveLength(0);
	});
});
