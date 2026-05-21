import { existsSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { argv } from 'process';
import { PathData } from 'webpack';

export const projectRoot = path.resolve('.');

export const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';

export const isProduction = mode === 'production';

export const isWebpackServeMode = argv.includes('serve');

export const isPreloadChunk = (chunk: Exclude<PathData['chunk'], void>) =>
	Boolean(chunk.name && chunk.name.endsWith('-preload'));

export const getAppWindows = () => {
	const windowObjects: {
		name: string;
		renderer: string;
		preloadScript?: string;
	}[] = [];

	readdirSync(path.join(projectRoot, 'src/windows'), {
		withFileTypes: true,
	}).forEach((file) => {
		if (!file.isDirectory()) return;

		const rendererPath = path.resolve(
			path.join(file.parentPath, file.name, 'renderer.tsx'),
		);

		// Skip if no renderer
		if (!existsSync(rendererPath) || !statSync(rendererPath).isFile()) return;

		const preloadPath = path.resolve(
			path.join(file.parentPath, file.name, 'preload.ts'),
		);

		windowObjects.push({
			name: file.name,
			renderer: path.relative(projectRoot, rendererPath),
			preloadScript:
				existsSync(preloadPath) && statSync(preloadPath).isFile()
					? path.relative(projectRoot, preloadPath)
					: undefined,
		});
	});

	return windowObjects;
};
