#!/usr/bin/env node
import { Command } from 'commander';
import { resolve } from 'path';

import { loadConfig } from './config.js';
import { type ProgressEvent, runTranslation } from './runner.js';

const program = new Command();

program
	.name('transly')
	.description('Cache-driven LLM i18n translation CLI')
	.version('0.1.0')
	.option('-c, --config <path>', 'Path to the i18n config file', './i18n.config.js')
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
			await runTranslation(config, undefined, undefined, onProgress);
			console.log('\n✅ Translation complete.');
		} catch (err) {
			console.error(
				`\n❌ Translation failed: ${err instanceof Error ? err.message : String(err)}`,
			);
			process.exit(1);
		}
	});

program.parse(process.argv);
