import { once } from 'node:events';
import {
	createWriteStream,
	existsSync,
	renameSync,
	rmSync,
	statSync,
	WriteStream,
} from 'node:fs';
import { mkdir } from 'node:fs/promises';

import { FilePaths } from './PathsResolver';

export class UploadSession {
	constructor(private readonly paths: FilePaths) {}

	private stream?: WriteStream;
	private isInitializationCalled = false;
	private onCommit?: () => void;
	public async init(onCommit?: () => void) {
		this.assertNotAborted();

		if (this.stream) throw new Error('Session is already initialized');
		if (this.isInitializationCalled) throw new Error('Initialization is in progress');
		this.isInitializationCalled = true;
		this.onCommit = onCommit;

		const { resolvedPath, dirname, tmp } = this.paths;

		// Prevent write into directory
		if (existsSync(resolvedPath) && !statSync(resolvedPath).isFile())
			throw new Error(`Path is exist and it is not a file '${resolvedPath}'`);

		// Ensure directory
		await mkdir(dirname, { recursive: true });

		// Open stream
		if (existsSync(tmp)) rmSync(tmp);
		const stream = createWriteStream(tmp);
		await once(stream, 'open');

		this.stream = stream;
	}

	private error?: unknown;
	public async abort(error: unknown) {
		if (this.error !== undefined) throw new Error('Already aborted');

		// Set error immediately
		this.error = error;

		// Close stream
		if (this.stream) {
			this.stream.close();
			await once(this.stream, 'close');
		}
	}

	public async write(buffer: ArrayBuffer) {
		this.assertNotAborted();

		if (!this.stream) throw new Error('Session is not initialized yet');

		if (!this.stream.write(new Uint8Array(buffer))) {
			await once(this.stream, 'drain');
		}
	}

	public async commit() {
		this.assertNotAborted();

		if (!this.stream) throw new Error('Session is not initialized yet');

		const stream = this.stream;
		const paths = this.paths;

		try {
			// Finish stream
			stream.end();
			await once(stream, 'finish');
			this.assertNotAborted();

			// Make sure file is uploaded
			if (!existsSync(paths.tmp)) throw new Error('Temporary file is not found');

			// Remove backup file
			if (existsSync(paths.bkp)) rmSync(paths.bkp);

			// Backup file
			if (existsSync(paths.resolvedPath)) renameSync(paths.resolvedPath, paths.bkp);

			// Rename temp file
			renameSync(paths.tmp, paths.resolvedPath);
			if (existsSync(paths.bkp)) rmSync(paths.bkp);
		} finally {
			this.onCommit?.();
		}
	}

	public assertNotAborted() {
		// eslint-disable-next-line @typescript-eslint/only-throw-error
		if (this.error !== undefined) throw this.error;
	}
}
