import { describe, expect, it, vi } from 'vitest';

import { computeHash } from '../src/cache.js';
import { runTranslation } from '../src/runner.js';
import type { CacheFile, Config, FsAdapter, TranslationItem } from '../src/types.js';

// ---------------------------------------------------------------------------
// Helpers (shared with pipeline.test.ts — duplicated here for isolation)
// ---------------------------------------------------------------------------

function makeConfig(overrides: Partial<Config> = {}): Config {
	return {
		sourceLang: 'en',
		targetLangs: ['de'],
		localesDir: '/locales',
		cacheDir: '/cache',
		model: 'test-model',
		apiKey: 'test-key',
		prompt: 'Translate.',
		maxBatchSize: 2, // small batch size to force multiple chunks
		...overrides,
	};
}

function makeMemFs(initial: Record<string, string> = {}): {
	fs: FsAdapter;
	store: Map<string, string>;
} {
	const store = new Map<string, string>(Object.entries(initial));

	const fs: FsAdapter = {
		async readFile(path) {
			const data = store.get(path);
			if (data === undefined) throw new Error(`ENOENT: ${path}`);
			return data;
		},
		async writeFile(path, data) {
			store.set(path, data);
		},
		async mkdir() {
			return undefined;
		},
		async readdir(path) {
			const prefix = path.endsWith('/') ? path : `${path}/`;
			const children = new Set<string>();
			for (const key of store.keys()) {
				if (key.startsWith(prefix)) {
					const rest = key.slice(prefix.length);
					const segment = rest.split('/')[0];
					if (segment) children.add(segment);
				}
			}
			return Array.from(children);
		},
		async access(path) {
			if (!store.has(path)) throw new Error(`ENOENT: ${path}`);
		},
	};

	return { fs, store };
}

// ---------------------------------------------------------------------------
// Partial failure tests
// ---------------------------------------------------------------------------

describe('Partial failure handling', () => {
	it('preserves successful chunk in cache when second chunk fails', async () => {
		// 4 keys, batch size 2 → 2 chunks
		// chunk 1: key0, key1 → succeeds
		// chunk 2: key2, key3 → throws
		const sourceObj = {
			key0: 'value 0',
			key1: 'value 1',
			key2: 'value 2',
			key3: 'value 3',
		};

		const { fs, store } = makeMemFs({
			'/locales/en/notes.json': JSON.stringify(sourceObj),
		});

		let callCount = 0;
		const mockTranslate = vi.fn(
			async (items: TranslationItem[], targetLang: string) => {
				callCount++;
				if (callCount === 2) {
					throw new Error('LLM rate limit exceeded');
				}
				const result: Record<string, string> = {};
				for (const item of items) {
					result[item.key] = `[${targetLang}] ${item.value}`;
				}
				return result;
			},
		);

		// The pipeline should throw because chunk 2 failed
		await expect(runTranslation(makeConfig(), fs, mockTranslate)).rejects.toThrow(
			'LLM rate limit exceeded',
		);

		// Cache file MUST exist (written after chunk 1 succeeded)
		expect(store.has('/cache/notes.de.json')).toBe(true);

		const cache = JSON.parse(store.get('/cache/notes.de.json')!) as CacheFile;

		// Chunk 1 keys (key0, key1) MUST be in cache
		expect(cache['key0']).toBeDefined();
		expect(cache['key0'].hash).toBe(computeHash('value 0'));
		expect(cache['key0'].translations['de']).toBe('[de] value 0');

		expect(cache['key1']).toBeDefined();
		expect(cache['key1'].hash).toBe(computeHash('value 1'));
		expect(cache['key1'].translations['de']).toBe('[de] value 1');

		// Chunk 2 keys (key2, key3) MUST NOT be in cache
		expect(cache['key2']).toBeUndefined();
		expect(cache['key3']).toBeUndefined();
	});

	it('resumes from where it left off on retry after partial failure', async () => {
		const sourceObj = {
			key0: 'value 0',
			key1: 'value 1',
			key2: 'value 2',
			key3: 'value 3',
		};

		const { fs, store } = makeMemFs({
			'/locales/en/notes.json': JSON.stringify(sourceObj),
		});

		let callCount = 0;
		const failingTranslate = vi.fn(
			async (items: TranslationItem[], targetLang: string) => {
				callCount++;
				if (callCount === 2) throw new Error('Simulated failure');
				const result: Record<string, string> = {};
				for (const item of items) {
					result[item.key] = `[${targetLang}] ${item.value}`;
				}
				return result;
			},
		);

		// First run — fails on chunk 2
		await expect(
			runTranslation(makeConfig(), fs, failingTranslate),
		).rejects.toThrow();

		// Second run — should only translate key2 and key3 (key0, key1 are cached)
		const retryCallLog: { items: TranslationItem[] }[] = [];
		const retryTranslate = vi.fn(
			async (items: TranslationItem[], targetLang: string) => {
				retryCallLog.push({ items: [...items] });
				const result: Record<string, string> = {};
				for (const item of items) {
					result[item.key] = `[${targetLang}] ${item.value}`;
				}
				return result;
			},
		);

		await runTranslation(makeConfig(), fs, retryTranslate);

		// Only 1 chunk should be translated on retry (key2, key3)
		expect(retryTranslate).toHaveBeenCalledTimes(1);
		expect(retryCallLog[0].items.map((i) => i.key)).toEqual(
			expect.arrayContaining(['key2', 'key3']),
		);
		expect(retryCallLog[0].items).toHaveLength(2);

		// Final output should have all 4 keys
		expect(store.has('/locales/de/notes.json')).toBe(true);
		const output = JSON.parse(store.get('/locales/de/notes.json')!);
		expect(output.key0).toBe('[de] value 0');
		expect(output.key1).toBe('[de] value 1');
		expect(output.key2).toBe('[de] value 2');
		expect(output.key3).toBe('[de] value 3');
	});

	it('does not corrupt cache when first chunk fails', async () => {
		const sourceObj = { key0: 'value 0', key1: 'value 1' };

		const { fs, store } = makeMemFs({
			'/locales/en/notes.json': JSON.stringify(sourceObj),
		});

		const mockTranslate = vi.fn(async () => {
			throw new Error('Immediate failure');
		});

		await expect(runTranslation(makeConfig(), fs, mockTranslate)).rejects.toThrow(
			'Immediate failure',
		);

		// Cache file should NOT exist (nothing was successfully translated)
		expect(store.has('/cache/notes.de.json')).toBe(false);
	});

	it('preserves multiple successful chunks when a later chunk fails', async () => {
		// 6 keys, batch size 2 → 3 chunks
		// chunk 1: succeeds, chunk 2: succeeds, chunk 3: fails
		const sourceObj: Record<string, string> = {};
		for (let i = 0; i < 6; i++) {
			sourceObj[`key${i}`] = `value ${i}`;
		}

		const { fs, store } = makeMemFs({
			'/locales/en/notes.json': JSON.stringify(sourceObj),
		});

		let callCount = 0;
		const mockTranslate = vi.fn(
			async (items: TranslationItem[], targetLang: string) => {
				callCount++;
				if (callCount === 3) throw new Error('Third chunk failed');
				const result: Record<string, string> = {};
				for (const item of items) {
					result[item.key] = `[${targetLang}] ${item.value}`;
				}
				return result;
			},
		);

		await expect(runTranslation(makeConfig(), fs, mockTranslate)).rejects.toThrow(
			'Third chunk failed',
		);

		const cache = JSON.parse(store.get('/cache/notes.de.json')!) as CacheFile;

		// Chunks 1 and 2 (key0–key3) should be in cache
		for (let i = 0; i < 4; i++) {
			expect(cache[`key${i}`]).toBeDefined();
			expect(cache[`key${i}`].translations['de']).toBe(`[de] value ${i}`);
		}

		// Chunk 3 (key4, key5) should NOT be in cache
		expect(cache['key4']).toBeUndefined();
		expect(cache['key5']).toBeUndefined();
	});
});
