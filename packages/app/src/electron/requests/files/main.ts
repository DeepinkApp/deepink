import { BrowserWindow, dialog } from 'electron';
import { globSync } from 'fast-glob';
import { lstatSync } from 'fs';

import * as filesUtils from '../../utils/files';
import { ipcMainHandler } from '../../utils/ipc/ipcMainHandler';

import { readFile, realpath } from 'fs/promises';
import { filesChannel } from '.';

export const serveFiles = () =>
	filesChannel.server(ipcMainHandler, {
		async getUserDataPath({ req: [path] }) {
			return filesUtils.getUserDataPath(path);
		},

		async selectDirectory({ ctx: evt }) {
			const window = BrowserWindow.getAllWindows().find(
				(win) => win.webContents.id === evt.sender.id,
			);
			if (!window) return null;

			const { filePaths } = await dialog.showOpenDialog(window, {
				properties: ['openDirectory'],
			});

			return filePaths;
		},

		async importNotes({ ctx: evt }) {
			const window = BrowserWindow.getAllWindows().find(
				(win) => win.webContents.id === evt.sender.id,
			);
			if (!window) return;

			console.warn('Start export');
			const { filePaths } = await dialog.showOpenDialog(window, {
				properties: ['openDirectory'],
			});
			if (filePaths.length === 0) return;

			const directoryToScan = filePaths[0];
			const files = globSync(`${directoryToScan}/{*,**/*}`);

			const rootDir = await realpath(directoryToScan);
			const filesMap: Record<string, ArrayBuffer> = {};
			await Promise.all(
				files.map(async (file) => {
					const absoluteFilename = await realpath(file);
					if (!absoluteFilename.startsWith(rootDir)) return;
					if (!lstatSync(file).isFile()) return;

					const rootPathLengthWithSlash = rootDir.length + 1;
					const filename = absoluteFilename.slice(rootPathLengthWithSlash);
					const buffer = await readFile(file);
					filesMap[filename] = new Uint8Array(buffer.buffer).buffer;
				}),
			);

			return filesMap;
		},
	});
