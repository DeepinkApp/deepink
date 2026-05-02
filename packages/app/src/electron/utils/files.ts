import { app } from 'electron';
import path from 'path';

import { isDevMode } from './app';

/**
 * Safe join path segments and resolve it
 *
 * In case resolved path are out of root path - thrown error
 */
export const joinPath = (root: string, ...segments: string[]) => {
	const resolvedPath = path.resolve(path.join(root, ...segments));
	if (!resolvedPath.startsWith(root)) {
		throw new TypeError('Resolved path is out of root directory');
	}

	return resolvedPath;
};

export const getResourcesPath = (resourcePath?: string) => {
	const rootPath = joinPath(app.getAppPath(), 'dist');
	return resourcePath ? joinPath(rootPath, resourcePath) : rootPath;
};

export const getUserDataPath = (...resourcePath: (string | undefined)[]) => {
	// Docs: https://www.electronjs.org/docs/latest/api/app#appgetpathname
	const rootPath = isDevMode()
		? joinPath(app.getAppPath(), 'tmp')
		: joinPath(app.getPath('userData'), 'app');

	const pathSegments = resourcePath.filter(Boolean) as string[];
	return pathSegments.length > 0 ? joinPath(rootPath, ...pathSegments) : rootPath;
};
