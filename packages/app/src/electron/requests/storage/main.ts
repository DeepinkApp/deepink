import { IpcMainInvokeEvent } from 'electron';
import { ApiToHandlers } from '@electron/utils/ipc';

import { ipcMainHandler } from '../../utils/ipc/ipcMainHandler';

import { FilesStorage } from './FilesStorage';
import { PathsResolver, StorageOptions } from './PathsResolver';
import { UploadSessions } from './UploadSessions';
import { storageChannel, StorageChannelAPI } from '.';

export const createStorageBackend = ({ tmpPrefix = '.tmp-fs' }: StorageOptions = {}) => {
	const pathsResolver = new PathsResolver({ tmpPrefix });
	const uploadSessions = new UploadSessions(pathsResolver);
	const storage = new FilesStorage(pathsResolver, uploadSessions);

	return {
		async get({ req: [fileId, subdir] }) {
			return storage.get(fileId, subdir);
		},

		async delete({ req: [fileIds, subdir] }) {
			return storage.delete(fileIds, subdir);
		},

		async list({ req: [subdir] }) {
			return storage.list(subdir);
		},

		createUploadSession: async ({
			req: [fileId, subdir],
		}: {
			req: [id: string, subdir: string];
			ctx: Electron.IpcMainInvokeEvent;
		}): Promise<string | undefined> => {
			return uploadSessions.create(fileId, subdir);
		},

		uploadChunk: async function ({
			req: [sessionId, buffer],
		}: {
			req: [id: string, buffer: ArrayBuffer];
			ctx: Electron.IpcMainInvokeEvent;
		}) {
			const session = uploadSessions.getById(sessionId);
			if (!session) throw new Error(`No session found with id ${sessionId}`);

			await session.write(buffer);
		},

		commitUpload: async function ({
			req: [sessionId],
		}: {
			req: [id: string];
			ctx: Electron.IpcMainInvokeEvent;
		}) {
			const session = uploadSessions.getById(sessionId);
			if (!session) throw new Error(`No session found with id ${sessionId}`);

			await session.commit();
		},
	} satisfies ApiToHandlers<StorageChannelAPI, IpcMainInvokeEvent>;
};

export const enableStorage = (options: StorageOptions = {}) =>
	storageChannel.server(ipcMainHandler, createStorageBackend(options));
