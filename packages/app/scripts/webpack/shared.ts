import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import path from 'path';
import { SwcMinifyWebpackPlugin } from 'swc-minify-webpack-plugin';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import { Configuration } from 'webpack';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';

import {
	isPreloadChunk,
	isProduction,
	isWebpackServeMode,
	mode,
	projectRoot,
} from './utils';

const outputPath = path.join(projectRoot, 'dist');

console.log('Webpack run', {
	isProduction,
	outputPath,
	isWebpackServeMode,
});

export default {
	mode,
	devtool: isProduction ? undefined : 'source-map',
	stats: {
		colors: true,
		reasons: true,
		hash: true,
		version: true,
		timings: true,
		chunks: true,
		chunkModules: true,
		cached: true,
		cachedAssets: true,
	},
	optimization: {
		// enable tree-shaking
		usedExports: true,
		minimize: isProduction,
		minimizer: [
			new SwcMinifyWebpackPlugin({
				module: true, // ← tells SWC the output is ESM, allows import/export
			}),
		],

		// Extract runtime into separate chunk for better caching
		runtimeChunk: isProduction ? 'single' : false,

		// Split vendor chunks to enable better caching
		splitChunks: {
			chunks: (chunk) => {
				// Don't split preload scripts - bundle them completely
				if (isPreloadChunk(chunk)) return false;

				// Apply normal splitting for other chunks
				return 'all';
			},

			cacheGroups: {
				// Vendor libraries (stable, rarely change)
				vendor: {
					test: /[\\/]node_modules[\\/]/,
					name: 'vendors',
					priority: 10,
					reuseExistingChunk: true,
					enforce: true,
				},
				// Shared code between windows
				common: {
					minChunks: 2, // Extracted if used in 2+ chunks
					priority: 5,
					reuseExistingChunk: true,
					name: 'common',
				},
			},
		},

		// Deterministic module IDs for better caching
		moduleIds: isProduction ? 'deterministic' : 'named',
	},
	node: {
		__dirname: false,
	},
	resolve: {
		extensions: ['.js', '.ts', '.tsx'],
		plugins: [new TsconfigPathsPlugin({})],
	},
	output: {
		path: outputPath,
		publicPath: isWebpackServeMode ? '/' : './',

		// Better chunk naming for caching
		chunkFilename: isProduction ? '[name].[contenthash].js' : '[name].js',
		filename: (pathData) => {
			if (pathData.chunk?.name === 'main') {
				return 'main.js';
			}

			// Preload scripts: no hash, just exact name
			if (pathData.chunk && isPreloadChunk(pathData.chunk)) {
				return '[name].js';
			}

			// Other chunks: keep hashed
			return '[name].[contenthash].js';
		},
	},
	module: {
		rules: [
			{
				// compiles TS/TSX excluding workers with SWC (fast)
				test: /\.tsx?$/,
				loader: 'swc-loader',
				options: {
					jsc: {
						parser: { syntax: 'typescript', tsx: true, decorators: true },
						transform: {
							react: {
								runtime: 'automatic',
								pragma: 'React.createElement',
								pragmaFrag: 'React.Fragment',
								development: !isProduction && isWebpackServeMode,
								refresh: !isProduction && isWebpackServeMode,
							},
						},
						target: 'es2022',
					},
					sourceMaps: true,
				},
			},

			// Replace babel-loader rule for .js
			{
				test: /\.js$/,
				exclude: /node_modules/, // remove/adjust if you need to compile JS in node_modules
				loader: 'swc-loader',
				options: {
					jsc: {
						parser: { syntax: 'ecmascript', jsx: false },
						target: 'es2022',
					},
					sourceMaps: true,
				},
			},
			{
				test: /\.sql$/,
				type: 'asset/source',
			},
		],
	},

	plugins: [
		...(isWebpackServeMode ? [new ReactRefreshWebpackPlugin()] : []),
		// run full TS type check in parallel; async: false -> build waits for typecheck and fails on errors
		new ForkTsCheckerWebpackPlugin({
			// Allow async in dev for faster builds
			async: !isProduction,
			typescript: { configFile: path.join(projectRoot, 'tsconfig.json') },
		}),
	],

	watchOptions: {
		ignored: '**/node_modules',
	},
} as Configuration;
