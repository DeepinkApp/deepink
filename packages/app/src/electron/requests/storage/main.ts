import { IpcMainInvokeEvent } from 'electron';
import { existsSync, statSync } from 'fs';
import path from 'path';
import recursive from 'recursive-readdir';
import { joinBuffers } from '@core/encryption/utils/buffers';
import { ApiToHandlers } from '@electron/utils/ipc';
import { recoveryAtomicFile, writeFileAtomic } from '@utils/files';

import { getUserDataPath, joinPath } from '../../utils/files';
import { ipcMainHandler } from '../../utils/ipc/ipcMainHandler';

import { mkdir, readFile, rm } from 'fs/promises';
import { storageChannel, StorageChannelAPI } from '.';

export const createStorageBackend = () => {
	const getScopedPath = (subdir: string | undefined, path?: string) =>
		path ? joinPath(getUserDataPath(subdir), path) : getUserDataPath(subdir);

	let uploadId = 0;
	const pathUploadSessions = new Map<string, string>();
	const uploadSessions = new Map<
		string,
		{
			path: string;
			// TODO: write buffers instantly to a file
			buffer: ArrayBuffer[];
			error?: unknown;
		}
	>();

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
			const resolvedPath = getScopedPath(subdir, fileId);

			// Cancel previous session
			const previousSessionId = pathUploadSessions.get(resolvedPath);
			if (previousSessionId !== undefined) {
				// TODO: schedule deletion by timeout for case the session will not be accessed
				const session = uploadSessions.get(previousSessionId);
				if (session) {
					session.error = new Error('Another session is started');
					session.buffer = [];
				}
			}

			// Start new session
			const sessionId = String(++uploadId);
			pathUploadSessions.set(resolvedPath, sessionId);
			uploadSessions.set(sessionId, {
				path: resolvedPath,
				buffer: [],
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

			session.buffer.push(buffer);
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

			const { path: filePath, buffer } = session;

			await mkdir(path.dirname(filePath), { recursive: true });

			console.time('Convert buffer');
			const nodeBuffer = Buffer.from(joinBuffers(buffer));
			console.timeEnd('Convert buffer');

			try {
				await writeFileAtomic(filePath, nodeBuffer);
			} finally {
				uploadSessions.delete(sessionId);
			}
		},
	} satisfies ApiToHandlers<StorageChannelAPI, IpcMainInvokeEvent>;
};

export const enableStorage = () =>
	storageChannel.server(ipcMainHandler, createStorageBackend());
