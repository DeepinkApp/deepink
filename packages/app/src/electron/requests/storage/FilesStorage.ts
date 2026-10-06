import { existsSync, rmSync, statSync } from 'fs';
import path from 'path';

import { readdir, rm } from 'fs/promises';
import { PathsResolver } from './PathsResolver';
import { UploadSessions } from './UploadSessions';

export class FilesStorage {
	constructor(
		private readonly paths: PathsResolver,
		private readonly opSessions: UploadSessions,
	) {}

	async delete(fileIds: string[], subdir: string) {
		for (const fileId of fileIds) {
			const { resolvedPath, bkp, tmp } = this.paths.getFilePaths(subdir, fileId);

			// Skip special files
			if (!this.paths.isAllowedPath(resolvedPath)) continue;

			if (existsSync(resolvedPath) && statSync(resolvedPath).isDirectory()) {
				// Recursive directory deletion
				await rm(resolvedPath, { force: true, recursive: true });
				console.debug('Directory removed', resolvedPath);
			} else {
				// Delete file and its related files
				const pathsToRemove = [resolvedPath, bkp];
				if (!this.opSessions.getByFilename(resolvedPath)) pathsToRemove.push(tmp);

				for (const path of pathsToRemove) {
					if (!existsSync(path) || !statSync(path).isFile()) continue;
					rmSync(path);
					console.debug('File deleted', path);
				}
			}
		}
	}

	async list(subdir: string) {
		const filesDir = this.paths.getScopedPath(subdir);

		if (!existsSync(filesDir)) return [];

		const files: string[] = [];
		for (const entry of await readdir(filesDir, {
			recursive: true,
			withFileTypes: true,
		})) {
			// Skip non-files
			if (!entry.isFile() || entry.isSymbolicLink()) continue;

			const resolvedFilename = path.resolve(
				path.join(entry.parentPath, entry.name),
			);

			// Skip special files
			if (!this.paths.isAllowedPath(resolvedFilename)) continue;

			// Remove root path
			const virtualPath = resolvedFilename
				.slice(filesDir.length)
				.split(path.sep)
				.join('/');

			files.push(virtualPath);
		}

		return files;
	}
}
