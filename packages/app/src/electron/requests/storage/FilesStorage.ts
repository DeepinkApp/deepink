import { existsSync, renameSync, rmSync, statSync } from 'fs';
import path from 'path';
import recursive from 'recursive-readdir';

import { readFile, rm } from 'fs/promises';
import { PathsResolver } from './PathsResolver';
import { UploadSessions } from './UploadSessions';

export class FilesStorage {
	constructor(
		private readonly paths: PathsResolver,
		private readonly opSessions: UploadSessions,
	) {}

	async get(fileId: string, subdir: string) {
		// Do not return special files
		if (!this.paths.isAllowedPath(fileId)) return null;

		const { resolvedPath, bkp } = this.paths.getFilePaths(subdir, fileId);

		// Restore file
		if (!existsSync(resolvedPath) && existsSync(bkp) && statSync(bkp).isFile()) {
			renameSync(bkp, resolvedPath);
		}

		if (!existsSync(resolvedPath) || !statSync(resolvedPath).isFile()) return null;

		const buffer = await readFile(resolvedPath);
		return new Uint8Array(buffer).buffer;
	}

	async delete(fileIds: string[], subdir: string) {
		for (const fileId of fileIds) {
			// Skip special files
			if (!this.paths.isAllowedPath(fileId)) continue;

			const { resolvedPath, bkp, tmp } = this.paths.getFilePaths(subdir, fileId);

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

		const files = await recursive(filesDir);
		return files
			.values()
			.filter((path) => this.paths.isAllowedPath(path))
			.map((filename) =>
				// Remove root path
				filename.slice(filesDir.length).split(path.sep).join('/'),
			)
			.toArray();
	}
}
