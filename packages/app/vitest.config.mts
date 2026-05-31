import { readFileSync } from 'fs';
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defaultExclude, defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		tsconfigPaths(),
		{
			name: 'vite-plugin-custom-imports',
			enforce: 'pre',
			load(id) {
				// Return content of SQL files
				if (id.endsWith('.sql')) {
					const sqlContent = readFileSync(resolve(id), 'utf-8');
					return `export default ${JSON.stringify(sqlContent)};`;
				}

				// Return `file://` urls on `.wasm` files
				if (id.endsWith('.wasm')) {
					const wasmFileUrl = pathToFileURL(resolve(id)).href;
					return `export default ${JSON.stringify(wasmFileUrl)};`;
				}

				return;
			},
		},
	],
	test: {
		env: {
			// TODO: disable once bug will be fixed: https://github.com/vitest-dev/vitest/issues/9927
			VITEST_WEB_WORKER_CLONE: 'none',
		},
		globals: true,
		setupFiles: ['@vitest/web-worker'],
		exclude: defaultExclude.concat(['tmp/**', 'dist/**', 'out/**']),

		// DB initialization takes some time at first time,
		// so we increase default timeout.
		// As alternative solution we may wait initialization in `beforeAll` hook
		testTimeout: 10_000,

		projects: [
			{
				extends: true,
				test: {
					name: 'node',
					environment: 'node',
					exclude: ['**/*.dom.test.ts'],
				},
			},
			{
				extends: true,
				test: {
					name: 'dom',
					environment: 'jsdom',
					setupFiles: ['scripts/vitest.setup.ts'],
					include: ['**/*.dom.test.ts'],
				},
			},
		],
	},
});
