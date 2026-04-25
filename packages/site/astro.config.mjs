/* eslint-disable @cspell/spellchecker */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import path from 'node:path';

import { defineConfig } from 'astro/config';
import remarkExternalLinks from 'remark-external-links';
import starlightThemeFlexoki from 'starlight-theme-flexoki';
import svgr from 'vite-plugin-svgr';
import react from '@astrojs/react';
import starlight from '@astrojs/starlight';

import remarkMermaid from './src/plugins/renderMermaid'

// https://astro.build/config
export default defineConfig({
	site: 'https://deepink.io',

	vite: {
		ssr: {
			// Fix build error. See details at https://github.com/withastro/astro/issues/14117#issuecomment-3117797751
			noExternal: ['zod'],
		},
		plugins: [
			svgr({
				include: '**/*.svg?react',
				svgrOptions: {
					plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
					svgoConfig: {
						plugins: [
							'preset-default',
							'removeTitle',
							'removeDesc',
							'removeDoctype',
							'cleanupIds',
						],
					},
				},
			}),
			{
				name: 'watch-external-dir',
				configureServer(server) {
					const watchedDir = path.resolve(`src/i18n/locales`);

					// Tell Vite to watch this directory
					server.watcher.add(watchedDir);

					server.watcher.on('change', (file) => {
						if (file.startsWith(watchedDir)) {
							server.ws.send({ type: 'full-reload' });
						}
					});
				},
			},
		],
	},

	markdown: {
		remarkPlugins: [
			[remarkExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
			remarkMermaid,
		],
		syntaxHighlight: {
			excludeLangs: ["mermaid"],
		},
	},

	integrations: [
		starlight({
			plugins: [starlightThemeFlexoki()],
			title: 'Deepink',
			description: "Deepink is a privacy focused note taking app with a light speed workflow. One space for everyday life, another for books, another for plans. Switch contexts in a click, keep things clean, and keep writing without overthinking where it should go.",
			favicon: '/favicon.svg',
			logo: {
				replacesTitle: true,
				src: './src/components/Layout/logo.svg',
			},
			disable404Route: true,
			customCss: ['./src/styles.css'],
			social: [
				{
					icon: 'cloud-download',
					label: 'Download Deepink',
					href: '/download',
				},
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/vitonsky/deepink',
				},
			],
			sidebar: [
				{
					label: 'Introduction',
					autogenerate: { directory: 'introduction' },
				},
			],

			components: {
				PageFrame: './src/components/PageFrame.astro',
			},
		}),
		react(),
	],
});