/* eslint-disable @cspell/spellchecker */
import 'dotenv/config';

export default {
	appId: 'app.deepink',
	productName: 'Deepink',
	directories: {
		output: 'release',
	},
	files: ['dist/**/*', 'package.json'],
	extraResources: [
		{
			from: 'dist/assets',
			to: 'assets',
		},
	],
	asar: true,
	mac: {
		target: ['dmg', 'zip'],
		icon: 'assets/icons/app.icns',
		hardenedRuntime: true,
	},
	win: {
		target: ['nsis'],
		icon: 'dist/assets/icons/app.ico',
	},
	nsis: {
		oneClick: false,
		allowToChangeInstallationDirectory: true,
		runAfterFinish: true,
	},
	linux: {
		target: ['AppImage', 'deb'],
		icon: 'assets/icons',
	},
	deb: {
		maintainer: 'YOUR_NAME',
		category: 'office',
	},
};
