#!/usr/bin/env node
import { Command } from 'commander';
import { resolve } from 'path';

import { description, name, version } from '../package.json';
import { loadConfig } from './config.js';
import { translateChunk } from './llm';
import { makeNodeFsAdapter, type ProgressEvent, runTranslation } from './runner.js';

const program = new Command();

program
	.name(name)
	.description(description)
	.version(version)
	.option('-c, --config <path>', 'Path to the i18n config file', './transly.config.js')
	.action(async (options: { config: string }) => {
		const configPath = resolve(options.config);

		console.log(`Loading config from: ${configPath}`);

		let config;
		try {
			config = await loadConfig(configPath);
		} catch (err) {
			console.error(
				`\n❌ Config error: ${err instanceof Error ? err.message : String(err)}`,
			);
			process.exit(1);
		}

		console.log(`Source language: ${config.sourceLang}`);
		console.log(`Target languages: ${config.targetLangs.join(', ')}`);
		console.log(`Locales directory: ${config.localesDir}`);
		console.log(`Cache directory: ${config.cacheDir}`);
		console.log(`Model: ${config.model}`);
		console.log('');

		const onProgress = (event: ProgressEvent) => {
			switch (event.type) {
				case 'namespace_start':
					if (event.changedKeys > 0) {
						console.log(
							`  📝 [${event.targetLang}] ${event.namespace}: ${event.changedKeys}/${event.totalKeys} keys to translate`,
						);
					}
					break;
				case 'no_changes':
					console.log(
						`  ✅ [${event.targetLang}] ${event.namespace}: no changes`,
					);
					break;
				case 'chunk_done':
					console.log(
						`     chunk ${event.chunkIndex + 1}/${event.totalChunks} done`,
					);
					break;
				case 'namespace_done':
					console.log(`  ✅ [${event.targetLang}] ${event.namespace}: done`);
					break;
			}
		};

		try {
			await runTranslation(
				config,
				makeNodeFsAdapter(),
				config.translateChunk ?? translateChunk,
				onProgress,
			);
			console.log('\n✅ Translation complete.');
		} catch (err) {
			console.error(
				`\n❌ Translation failed: ${err instanceof Error ? err.message : String(err)}`,
			);
			process.exit(1);
		}
	});

program.parse(process.argv);
