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
	const uploadSessions = new Map<
		string,
		{
			path: string;
			buffer: ArrayBuffer[];
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
			// TODO: ensure only one instance can write file
			const resolvedPath = getScopedPath(subdir, fileId);

			const sessionId = String(++uploadId);

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

			const { path: filePath, buffer } = session;

			await mkdir(path.dirname(filePath), { recursive: true });

			console.time('Convert buffer');
			const nodeBuffer = Buffer.from(joinBuffers(buffer));
			console.timeEnd('Convert buffer');

			await writeFileAtomic(filePath, nodeBuffer);
		},
	} satisfies ApiToHandlers<StorageChannelAPI, IpcMainInvokeEvent>;
};

export const enableStorage = () =>
	storageChannel.server(ipcMainHandler, createStorageBackend());
