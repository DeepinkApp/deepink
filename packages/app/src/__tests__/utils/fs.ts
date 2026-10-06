/* eslint-disable @typescript-eslint/no-base-to-string */
import { vol } from 'memfs';

export const readdir = (path: string) =>
	vol
		.readdirSync(path, { recursive: true })
		.sort((a, b) => String(a).localeCompare(String(b)));
