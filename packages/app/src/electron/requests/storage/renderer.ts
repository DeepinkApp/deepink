import { IEncryptionController } from '@core/encryption';
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
		private readonly encryption?: IEncryptionController,
		private readonly config: { chunkSize?: number } = {},
	) {
		this.subdirectory = subdirectory;
		this.encryption = encryption;
	}

	public async write(filename: string, buffer: ArrayBuffer) {
		const encryptedBuffer = this.encryption
			? await this.encryption.encrypt(buffer)
			: buffer;

		const sessionId = await this.storageApi.createUploadSession(
			filename,
			this.subdirectory,
		);

		const bufferCursor = new BufferCursor(encryptedBuffer);
		while (bufferCursor.getRemainingBytes() > 0) {
			const slice = bufferCursor.readBytes(
				1024 ** 2 * (this.config.chunkSize ?? 5),
			);
			if (!slice) throw new Error('Unexpected end of file');

			await this.storageApi.uploadChunk(sessionId, slice.slice(0).buffer);
		}

		await this.storageApi.commitUpload(sessionId);
	}

	public async get(id: string) {
		const sessionInfo = await this.storageApi.createReadSession(
			id,
			this.subdirectory,
		);
		if (!sessionInfo) return null;

		const { size, id: sessionId } = sessionInfo;

		const buffer = new ArrayBuffer(size, { maxByteLength: size * 3 });
		const bv = new Uint8Array(buffer);

		const chunkSize = 1024 ** 2 * (this.config.chunkSize ?? 5);
		let offset = 0;
		while (true) {
			const chunk = await this.storageApi.readChunk(sessionId, chunkSize);

			// End when whole file is drained
			if (!chunk) {
				await this.storageApi.closeReader(sessionId);
				if (buffer.byteLength !== offset) buffer.resize(offset);
				break;
			}

			// Extend buffer if needed
			const leftSpace = buffer.byteLength - offset;
			const extraSizeNeeded = chunk.byteLength - leftSpace;
			if (extraSizeNeeded > 0) {
				buffer.resize(buffer.byteLength + extraSizeNeeded);
			}

			// Write
			bv.set(new Uint8Array(chunk), offset);
			offset += chunk.byteLength;
		}

		return buffer;
	}

	public async delete(ids: string[]) {
		return this.storageApi.delete(ids, this.subdirectory);
	}

	public async list() {
		return this.storageApi.list(this.subdirectory);
	}
}
