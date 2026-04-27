/* eslint-disable @cspell/spellchecker */
/**
 * Integration test: real translateChunk wired into runTranslation.
 *
 * fetch is stubbed at the global level so no real network calls are made.
 * Everything else — cache, filesystem, chunking, flattening — runs for real.
 */
import { defineConfig } from 'src';
import { describe, expect, it } from 'vitest';

import { translateChunk } from '../../src/llm.js';
import { runTranslation } from '../../src/runner.js';

import { makeMemFs } from '../stubs/makeMemFs.js';

describe.skipIf(process.env.TEST_E2E_LLM !== 'enabled')('Translate texts', () => {
	const { fs, store } = makeMemFs({
		'/locales/en/common.json': JSON.stringify({
			hello: 'Hello',
			nested: {
				world: 'World',
			},
		}),
		'/locales/en/interpolation.json': JSON.stringify({
			introduction: 'My name is {{name}}, I like {{hobby}}',
			strength:
				'My name is {{name}}, I can pull {{weight}}kg and hang {{hangTime}} minutes!',
		}),
	});

	const config = defineConfig({
		sourceLang: 'en',
		targetLangs: ['ru'],

		localesDir: '/locales',
		cacheDir: '/.transly',

		apiKey: process.env.OPENAI_API_KEY!,
		baseUrl: process.env.OPENAI_API_URL,

		model: 'openai/gpt-4o-mini',
		contextPrompt: `Translate like you are cool boy`,

		maxBatchSize: 50, // optional, default: 50
		debug: true,
	});

	it('reads source file, calls the real LLM adapter, and writes translated output', async () => {
		await runTranslation(config, fs, translateChunk);

		expect(store.has('/locales/ru/interpolation.json')).toBe(true);

		expect(JSON.parse(store.get('/locales/ru/interpolation.json')!)).toEqual({
			introduction: expect.stringContaining('Меня зовут {{name}}'),
			strength: expect.stringContaining('{{hangTime}} минут'),
		});
	});
});
