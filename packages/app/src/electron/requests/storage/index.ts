import { createChannel } from '../../utils/ipc';

export type StorageChannelAPI = {
	createUploadSession: (fileId: string, subdir: string) => Promise<string>;
	uploadChunk: (sessionId: string, buffer: ArrayBuffer) => Promise<void>;
	commitUpload: (sessionId: string) => Promise<void>;

	get: (id: string, subdir: string) => Promise<ArrayBuffer | null>;
	delete: (ids: string[], subdir: string) => Promise<void>;
	list: (subdir: string) => Promise<string[]>;
};

export const storageChannel = createChannel<StorageChannelAPI>({ name: 'storage' });
