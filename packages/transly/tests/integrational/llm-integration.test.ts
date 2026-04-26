/**
 * Integration test: real translateChunk wired into runTranslation.
 *
 * fetch is stubbed at the global level so no real network calls are made.
 * Everything else — cache, filesystem, chunking, flattening — runs for real.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { translateChunk } from '../../src/llm.js';
import { runTranslation } from '../../src/runner.js';
import type { CacheFile } from '../../src/types.js';

import { makeConfig } from '../stubs/makeConfig.js';
import { makeFetchStub, makeOpenAiResponse } from '../stubs/makeFetchStub.js';
import { makeMemFs } from '../stubs/makeMemFs.js';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('LLM integration: translateChunk + runTranslation', () => {
	it('reads source file, calls the real LLM adapter, and writes translated output', async () => {
		const { fs, store } = makeMemFs({
			'/locales/en/notes.json': JSON.stringify({
				title: 'Hello',
				nested: { message: 'World' },
			}),
		});

		// Stub fetch to return a valid OpenAI response for the two flat keys
		vi.stubGlobal(
			'fetch',
			makeFetchStub(
				200,
				makeOpenAiResponse(
					JSON.stringify({
						title: 'Hallo',
						'nested.message': 'Welt',
					}),
				),
			),
		);

		await runTranslation(makeConfig(), fs, translateChunk);

		expect(store.get('/locales/de/notes.json')).toBe(
			JSON.stringify(
				{
					title: 'Hallo',
					nested: { message: 'Welt' },
				},
				null,
				2,
			),
		);
	});

	it('writes cache with correct hashes after a successful LLM call', async () => {
		const { fs, store } = makeMemFs({
			'/locales/en/notes.json': JSON.stringify({ greeting: 'Hello' }),
		});

		vi.stubGlobal(
			'fetch',
			makeFetchStub(200, makeOpenAiResponse(JSON.stringify({ greeting: 'Hallo' }))),
		);

		await runTranslation(makeConfig(), fs, translateChunk);

		expect(store.has('/cache/notes.de.json')).toBe(true);
		const cache = JSON.parse(store.get('/cache/notes.de.json')!) as CacheFile;
		expect(cache['greeting']).toBeDefined();
		expect(cache['greeting'].translations['de']).toBe('Hallo');
	});

	it('does not call fetch on second run when nothing changed', async () => {
		const { fs } = makeMemFs({
			'/locales/en/notes.json': JSON.stringify({ greeting: 'Hello' }),
		});

		const fetchSpy = vi.fn(
			makeFetchStub(200, makeOpenAiResponse(JSON.stringify({ greeting: 'Hallo' }))),
		);
		vi.stubGlobal('fetch', fetchSpy);

		// First run — populates cache
		await runTranslation(makeConfig(), fs, translateChunk);
		expect(fetchSpy).toHaveBeenCalled();
		fetchSpy.mockClear();

		// Second run — everything is cached
		await runTranslation(makeConfig(), fs, translateChunk);

		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('propagates LLM HTTP errors through the pipeline', async () => {
		const { fs } = makeMemFs({
			'/locales/en/notes.json': JSON.stringify({ greeting: 'Hello' }),
		});

		vi.stubGlobal(
			'fetch',
			makeFetchStub(429, { error: { message: 'Rate limit exceeded' } }),
		);

		await expect(runTranslation(makeConfig(), fs, translateChunk)).rejects.toThrow(
			'429',
		);
	});
});
