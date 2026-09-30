import { IpcMainInvokeEvent } from 'electron';
import { once } from 'events';
import {
	createWriteStream,
	existsSync,
	renameSync,
	rmSync,
	statSync,
	WriteStream,
} from 'fs';
import path from 'path';
import recursive from 'recursive-readdir';
import { ApiToHandlers } from '@electron/utils/ipc';
import { recoveryAtomicFile } from '@utils/files';

import { getUserDataPath, joinPath } from '../../utils/files';
import { ipcMainHandler } from '../../utils/ipc/ipcMainHandler';

import { mkdir, readFile, rm } from 'fs/promises';
import { storageChannel, StorageChannelAPI } from '.';

type FilePaths = {
	resolvedPath: string;
	dirname: string;
	filename: string;
	tmp: string;
	bkp: string;
};

export const createStorageBackend = ({
	tmpPrefix = '.tmp-fs',
}: { tmpPrefix?: string } = {}) => {
	const getScopedPath = (subdir: string | undefined, path?: string) =>
		path ? joinPath(getUserDataPath(subdir), path) : getUserDataPath(subdir);

	let uploadId = 0;
	const pathUploadSessions = new Map<string, string>();
	const uploadSessions = new Map<
		string,
		{
			paths: FilePaths;
			stream: WriteStream;
			error?: unknown;
		}
	>();

	const getFilePaths = (subdir: string, fileId: string) => {
		const resolvedPath = getScopedPath(subdir, fileId);
		const dirname = path.dirname(resolvedPath);
		const filename = path.basename(resolvedPath);

		const tmp = path.resolve(
			path.join(dirname, [tmpPrefix, 'tmp', filename].join('-')),
		);
		if (!tmp.startsWith(dirname))
			throw new Error('Temp file path is out of allowed path');

		const bkp = path.resolve(
			path.join(dirname, [tmpPrefix, 'bkp', filename].join('-')),
		);
		if (!bkp.startsWith(dirname))
			throw new Error('Backup file path is out of allowed path');

		return {
			resolvedPath,
			dirname,
			filename,
			tmp,
			bkp,
		} satisfies FilePaths;
	};

	return {
		async get({ req: [id, subdir] }) {
			const filePath = getScopedPath(subdir, id);

			recoveryAtomicFile(filePath);

			if (!existsSync(filePath) || !statSync(filePath).isFile()) return null;

			const buffer = await readFile(filePath);
			return new Uint8Array(buffer).buffer;
		},

		async delete({ req: [ids, subdir] }) {
			for (const id of ids) {
				const filePath = getScopedPath(subdir, id);

				if (!existsSync(filePath)) {
					console.debug('Not found file', filePath);
					continue;
				}

				await rm(filePath, { force: true, recursive: true });
				console.debug('Removed file', filePath);
			}
		},

		async list({ req: [subdir] }) {
			const filesDir = getScopedPath(subdir);

			if (!existsSync(filesDir)) return [];

			const files = await recursive(filesDir);
			return files.map((path) =>
				// Remove root path
				path.slice(filesDir.length),
			);
		},

		createUploadSession: async ({
			req: [fileId, subdir],
		}: {
			req: [id: string, subdir: string];
			ctx: Electron.IpcMainInvokeEvent;
		}): Promise<string | undefined> => {
			const paths = getFilePaths(subdir, fileId);
			const { resolvedPath } = paths;

			// Cancel previous session
			const previousSessionId = pathUploadSessions.get(resolvedPath);
			if (previousSessionId !== undefined) {
				// TODO: schedule deletion by timeout for case the session will not be accessed
				const session = uploadSessions.get(previousSessionId);
				if (session) {
					session.error = new Error('Another session is started');
					session.stream.close();
					await once(session.stream, 'close');
				}
			}

			// Create tmp file
			await mkdir(paths.dirname, { recursive: true });

			if (existsSync(paths.tmp)) rmSync(paths.tmp);
			const stream = createWriteStream(paths.tmp);
			await once(stream, 'open');

			// Start new session
			const sessionId = String(++uploadId);
			pathUploadSessions.set(resolvedPath, sessionId);
			uploadSessions.set(sessionId, {
				paths,
				stream,
			});

			return sessionId;
		},

		uploadChunk: async function ({
			req: [sessionId, buffer],
		}: {
			req: [id: string, buffer: ArrayBuffer];
			ctx: Electron.IpcMainInvokeEvent;
		}) {
			const session = uploadSessions.get(sessionId);
			if (!session) throw new Error(`No session found with id ${sessionId}`);

			// eslint-disable-next-line @typescript-eslint/only-throw-error
			if (session.error !== undefined) throw session.error;

			const { stream } = session;
			if (!stream.write(new Uint8Array(buffer))) {
				await once(stream, 'drain');
			}
		},

		commitUpload: async function ({
			req: [sessionId],
		}: {
			req: [id: string];
			ctx: Electron.IpcMainInvokeEvent;
		}) {
			const session = uploadSessions.get(sessionId);
			if (!session) throw new Error(`No session found with id ${sessionId}`);

			// eslint-disable-next-line @typescript-eslint/only-throw-error
			if (session.error !== undefined) throw session.error;

			const { paths, stream } = session;

			try {
				// Finish stream
				stream.end();
				await once(stream, 'finish');

				// Make sure file is uploaded
				if (!existsSync(paths.tmp))
					throw new Error('Temporary file is not found');

				// Remove backup file
				if (existsSync(paths.bkp)) rmSync(paths.bkp);

				// Backup file
				if (existsSync(paths.resolvedPath))
					renameSync(paths.resolvedPath, paths.bkp);

				// Rename temp file
				renameSync(paths.tmp, paths.resolvedPath);
				if (existsSync(paths.bkp)) rmSync(paths.bkp);
			} finally {
				uploadSessions.delete(sessionId);
			}
		},
	} satisfies ApiToHandlers<StorageChannelAPI, IpcMainInvokeEvent>;
};

export const enableStorage = () =>
	storageChannel.server(ipcMainHandler, createStorageBackend());
