import path from 'node:path';

import { getUserDataPath, joinPath } from '@electron/utils/files';

export type StorageOptions = { tmpPrefix?: string };

export type FilePaths = {
	resolvedPath: string;
	dirname: string;
	filename: string;
	tmp: string;
	bkp: string;
};

export class PathsResolver {
	private readonly config;
	constructor(config: StorageOptions = {}) {
		this.config = {
			tmpPrefix: '.tmp-fs',
			...config,
		};
	}

	public getScopedPath(subdir: string | undefined, path?: string) {
		return path ? joinPath(getUserDataPath(subdir), path) : getUserDataPath(subdir);
	}

	public getFilePaths(subdir: string, fileId: string) {
		const { tmpPrefix } = this.config;

		const resolvedPath = this.getScopedPath(subdir, fileId);
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
	}

	public isAllowedPath(filename: string) {
		const { tmpPrefix } = this.config;

		return filename.split('/').every((segment) => !segment.startsWith(tmpPrefix));
	}

	public getPrefix() {
		return this.config.tmpPrefix;
	}
}
