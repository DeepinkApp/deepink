import { BufferCursor } from '@core/encryption/utils/bytes/BufferCursor';
import { IFilesStorage } from '@core/features/files';

import { ipcRendererFetcher } from '../../utils/ipc/ipcRendererFetcher';

import { storageChannel, StorageChannelAPI } from '.';

export const storageApi = storageChannel.client(ipcRendererFetcher);

// TODO: transparently resolve all file names like it is absolute paths
export class ElectronFilesController implements IFilesStorage {
	constructor(
		private readonly storageApi: StorageChannelAPI,
		private readonly subdirectory: string,
		private readonly config: { chunkSize?: number } = {},
	) {}

	public async write(filename: string, buffer: ArrayBuffer) {
		const sessionId = await this.storageApi.createUploadSession(
			filename,
			this.subdirectory,
		);

		const bufferCursor = new BufferCursor(buffer);
		while (bufferCursor.getRemainingBytes() > 0) {
			const slice = bufferCursor.readBytes(
				1024 ** 2 * (this.config.chunkSize ?? 5),
			);
			if (!slice) throw new Error('Unexpected end of file');

			await this.storageApi.uploadChunk(sessionId, slice.slice(0).buffer);
		}

		await this.storageApi.commitUpload(sessionId);
	}

	public async get(filename: string) {
		const sessionInfo = await this.storageApi.createReadSession(
			filename,
			this.subdirectory,
		);
		if (!sessionInfo) return null;

		const { size, id: sessionId } = sessionInfo;

		const buffer = new Uint8Array(size);
		try {
			const chunkSize = 1024 ** 2 * (this.config.chunkSize ?? 5);
			let offset = 0;
			while (true) {
				const chunk = await this.storageApi.readChunk(sessionId, chunkSize);

				// End when whole file is drained
				if (!chunk) break;

				// Write
				buffer.set(new Uint8Array(chunk), offset);
				offset += chunk.byteLength;
			}
		} finally {
			await this.storageApi.closeReader(sessionId);
		}

		return buffer.buffer;
	}

	public async delete(filenames: string[]) {
		return this.storageApi.delete(filenames, this.subdirectory);
	}

	public async list() {
		return this.storageApi.list(this.subdirectory);
	}
}
