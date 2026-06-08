import { createStore, delMany, get, keys, set } from 'idb-keyval';
import { IFilesStorage } from '@core/features/files';
import { getResolvedPath } from '@utils/fs/paths';

export class IndexedDBFS implements IFilesStorage {
	private readonly store;

	constructor(storageName: string) {
		this.store = createStore(storageName, 'files');
	}

	async write(path: string, buffer: ArrayBuffer) {
		await set(getResolvedPath(path, '/'), buffer, this.store);
	}

	async get(path: string) {
		const result = await get<ArrayBuffer>(getResolvedPath(path, '/'), this.store);

		return result ?? null;
	}

	async delete(paths: string[]) {
		await delMany(
			paths.map((path) => getResolvedPath(path, '/')),
			this.store,
		);
	}

	async list() {
		const result = await keys(this.store);

		return result as string[];
	}
}
