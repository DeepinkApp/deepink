import { FileHandle, open } from 'node:fs/promises';

export class FileReadSession {
	private closed = false;
	private file: {
		fd: FileHandle;
		offset: number;
	} | null = null;
	public async open(filename: string) {
		const fd = await open(filename, 'r');

		this.file = { fd, offset: 0 };
		this.closed = false;
	}

	public async size() {
		const state = this.getState();
		const { size } = await state.fd.stat();
		return size;
	}

	public async read(size: number): Promise<ArrayBuffer | null> {
		const state = this.getState();

		const buffer = new ArrayBuffer(size);
		const { bytesRead } = await state.fd.read(
			new Uint8Array(buffer),
			0,
			size,
			state.offset,
		);

		state.offset += bytesRead;

		// No data
		if (bytesRead === 0) {
			// await this.close();
			return null;
		}

		return buffer.slice(0, bytesRead);
	}

	public async close(): Promise<void> {
		if (this.closed) return;

		this.closed = true;
		if (this.file) {
			const state = this.file;
			this.file = null;
			await state.fd.close();
		}
	}

	public getState() {
		if (this.closed) throw new Error('File descriptor is closed');
		if (!this.file) throw new Error('File is not opened');

		return this.file;
	}
}
