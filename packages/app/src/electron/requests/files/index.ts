import { createChannel } from '../../utils/ipc';

export const filesChannel = createChannel<{
	importNotes(): Promise<Record<string, ArrayBuffer>>;
	selectDirectory(): Promise<null | string[]>;
	getUserDataPath(path?: string): Promise<string>;
}>({ name: 'files' });
