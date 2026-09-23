import 'dotenv/config'

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import { viteStaticCopy } from 'vite-plugin-static-copy'
import tsconfigPaths from 'vite-tsconfig-paths';
import { defaultExclude, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';

const isHeadlessBrowser = process.env.HEADLESS_BROWSER !== 'off';

export default defineConfig({
	resolve: {
		dedupe: ['react', 'react-dom'],
	},
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
					exclude: ['./**/*.dom.test.ts', './**/*.browser.test.ts'],
					setupFiles: ['@vitest/web-worker', 'scripts/vitest.setup.ts'],
				},
			},
			{
				extends: true,
				test: {
					name: 'dom',
					environment: 'jsdom',
					include: ['./**/*.dom.test.ts'],
					setupFiles: ['@vitest/web-worker', 'scripts/vitest.setup.ts'],
				},
			},
			{
				resolve: {
					conditions: ['development', 'import', 'module', 'browser', 'default'],
				},
				define: {
					// https://react.dev/blog/2022/03/08/react-18-upgrade-guide#configuring-your-testing-environment
					IS_REACT_ACT_ENVIRONMENT: true,
				},
				extends: true,
				// Pre-bundle React (and react-dom/client) together so browser tests
				// that render React share a single React instance with the
				// source-aliased @lexical/react packages. Without this the optimized
				// react-dom/client bundle gets its own copy and hooks fail with a null
				// dispatcher ("Cannot read properties of null (reading 'useMemo')").
				optimizeDeps: {
					include: [
						'react',
						'react/jsx-dev-runtime',
						'react-dom',
						'react-dom/client',
					],
				},
				plugins: [
					react(),
					viteStaticCopy({
						targets: [
							{
								src: 'src/locales/**',
								dest: 'locales',
								rename: { stripBase: 2 }
							},
						],
					}),
				],
				// publicDir: 'src',
				test: {
					browser: {
						// Vitest's default browser server port (63315) is in the
						// ephemeral range, and Windows reserves randomized blocks of
						// that range (Hyper-V excluded port ranges), so on Windows CI
						// runners listen() occasionally fails with EACCES
						// (vitest-dev/vitest#9035). Pin a port below the ephemeral
						// range instead; if it happens to be busy, Vite falls back to
						// the next free port rather than failing.
						api: { port: 8315 },
						enabled: true,
						// at least one instance is required
						instances: [{ browser: 'chromium' }],
						// Headless everywhere by default so the suite runs the same way in
						// CI and in headless dev containers. Pass `--browser.headless=false`
						// (or use the Vitest UI) to debug in a real window locally.
						headless: isHeadlessBrowser,
						provider: playwright({
							launchOptions: {
								executablePath: process.env.PLAYWRIGHT_BROWSER_PATH,
								headless: isHeadlessBrowser,
							},
						}),
					},
					include: ['./**/*.browser.test.ts'],
					name: 'browser',
				},
			},
		],
	},
});
