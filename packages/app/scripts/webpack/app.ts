import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path from 'path';
import { Configuration, WebpackPluginInstance } from 'webpack';
import { merge } from 'webpack-merge';

import { productName } from '../../package.json';

import commonConfig from './shared';
import { getAppWindows, projectRoot } from './utils';

const windows = getAppWindows();

export default merge(commonConfig, {
	target: 'web',
	entry: {
		...Object.fromEntries(
			windows.map(({ name, renderer }) => [
				`window-${name}`,
				path.join(projectRoot, renderer),
			]),
		),
	},
	output: {
		module: true,
	},
	plugins: [
		...windows.map(
			({ name }) =>
				new HtmlWebpackPlugin({
					title: productName,
					filename: `window-${name}.html`,
					chunks: [`window-${name}`],
					template: path.join(projectRoot, 'src/templates/window.html'),
					scriptLoading: 'module',
				}),
		),
		new MiniCssExtractPlugin({}),
		new CopyWebpackPlugin({
			patterns: [
				{
					from: path.resolve(projectRoot, 'src/locales'),
					to: 'locales',
					filter(filePath) {
						return !filePath.includes('.transly');
					},
				},
			],
		}),
	] as unknown as WebpackPluginInstance[],
	// We explicitly define external imports instead of use `electron-renderer` target
	externals: {
		electron: 'global electron',
	},
	resolve: {
		fallback: {
			// eslint-disable-next-line camelcase
			worker_threads: false,
			'fs/promises': false,
		},
	},
	experiments: {
		asyncWebAssembly: true,
		outputModule: true,
	},
	module: {
		rules: [
			{
				test: /\.css$/,
				use: [
					MiniCssExtractPlugin.loader,
					{
						loader: 'css-loader',
						options: {
							modules: {
								namedExport: false,
								mode: (resourcePath: string) => {
									const isModule = resourcePath.endsWith('.module.css');
									return isModule ? 'local' : 'global';
								},
							},
						},
					},
				],
			},
			{
				test: /\.ttf$/,
				type: 'asset/resource',
			},
			{
				test: /\.wasm$/,
				type: 'asset/resource',
			},
			{
				test: /\.svg$/,
				exclude: /node_modules/,
				use: [
					{
						loader: '@svgr/webpack',
						options: {
							svgoConfig: {
								plugins: [
									{
										name: 'preset-default',
										params: {
											overrides: {
												// Option to prevent removing viewBox to svg can be resize
												// Issue created in 2017 https://github.com/gregberge/svgr/issues/18
												removeViewBox: false,
											},
										},
									},
								],
							},
							// This features do not work
							attributes: ['width', 'height'],
						},
					},
				],
			},
		],
	},
} as Configuration);
