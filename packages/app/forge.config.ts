/* eslint-disable @cspell/spellchecker */
import 'dotenv/config';

import type { MakerDebConfig } from '@electron-forge/maker-deb';
import type { MakerDMGConfig } from '@electron-forge/maker-dmg';
import type { MakerWixConfig } from '@electron-forge/maker-wix';
import type { MakerZIPConfig } from '@electron-forge/maker-zip';
import type { ForgeConfig } from '@electron-forge/shared-types';
import type { MakerAppImageConfig } from '@reforged/maker-appimage';

import projectInfo from './package.json';
import { getAbout } from './src/about';

// We do not need any files except those in dist
const allowedPathPrefixes = ['/dist', '/package.json'];

const about = getAbout();

// Docs: https://electron.github.io/packager/main/interfaces/Options.html
export default {
	packagerConfig: {
		asar: true,
		name: about.displayName,
		executableName: process.platform === 'darwin' ? about.displayName : about.name,
		icon: 'assets/icons/app',
		ignore(path) {
			const isAllowed =
				path.trim().length === 0 ||
				allowedPathPrefixes.some((allowedPath) => path.startsWith(allowedPath));
			return !isAllowed;
		},
		extraResource: ['./dist/assets'],
		osxSign: {
			identity: process.env.OSX_SIGN_IDENTITY,
		},
		osxNotarize: {
			appleId: process.env.APPLE_ID!,
			appleIdPassword: process.env.APPLE_ID_PASSWORD!,
			teamId: process.env.APPLE_TEAM_ID!,
		},
	},
	makers: [
		{
			name: '@electron-forge/maker-zip',
			config: {} satisfies MakerZIPConfig,
		},
		{
			name: '@electron-forge/maker-wix',
			platforms: ['win32'],
			config: {
				autoRun: true,
				icon: 'dist/assets/icons/app.ico',
				features: {
					autoLaunch: true,
					autoUpdate: false,
				},
				ui: {
					chooseDirectory: true,
				},
			} satisfies MakerWixConfig,
		},
		{
			name: '@electron-forge/maker-dmg',
			platforms: ['darwin'],
			config: {
				title: about.displayName,
				format: 'ULFO',
				overwrite: true,
			} satisfies MakerDMGConfig,
		},
		{
			name: '@reforged/maker-appimage',
			platforms: ['linux'],
			config: {
				options: {
					icon: 'assets/icons/app.png',
					categories: [
						'Office',
						'Education',
						'Dictionary',
						'Documentation',
						'Presentation',
						'ProjectManagement',
						'Science',
						'TextEditor',
						'TextTools',
						'Utility',
					],
				},
			} satisfies MakerAppImageConfig,
		},
		{
			name: '@electron-forge/maker-deb',
			platforms: ['linux'],
			config: {
				options: {
					productName: about.displayName,
					genericName: about.description,
					maintainer: projectInfo.author,
					icon: 'assets/icons/app.png',
					categories: ['Office', 'Science', 'Education'],
				},
			} satisfies MakerDebConfig,
		},
	],
	plugins: [
		{
			name: '@electron-forge/plugin-auto-unpack-natives',
			config: {},
		},
	],
} satisfies ForgeConfig;
