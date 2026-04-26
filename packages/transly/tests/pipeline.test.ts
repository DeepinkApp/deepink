import { describe, expect, it, vi } from 'vitest';

import { computeHash } from '../src/cache.js';
import { runTranslation } from '../src/runner.js';
import type { CacheFile, Config, FsAdapter, TranslationItem } from '../src/types.js';

// ---------------------------------------------------------------------------
// Helpers
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
		maxBatchSize: 10,
		...overrides,
	};
}

/**
 * Creates an in-memory FsAdapter backed by a simple Map.
 * Supports readdir by tracking which paths are "directories".
 */
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
			// Return filenames of all stored paths that are direct children of `path`
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

/**
 * Creates a deterministic mock translate function that prefixes values with
 * the target language code.
 */
function makeMockTranslate(callLog: { items: TranslationItem[]; targetLang: string }[]) {
	return vi.fn(async (items: TranslationItem[], targetLang: string) => {
		callLog.push({ items: [...items], targetLang });
		const result: Record<string, string> = {};
		for (const item of items) {
			result[item.key] = `[${targetLang}] ${item.value}`;
		}
		return result;
	});
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Full translation pipeline', () => {
	it('translates all keys when cache is empty', async () => {
		const sourceJson = JSON.stringify({ title: 'Hello', message: 'World' });
		const { fs, store } = makeMemFs({
			'/locales/en/notes.json': sourceJson,
		});

		const callLog: { items: TranslationItem[]; targetLang: string }[] = [];
		const mockTranslate = makeMockTranslate(callLog);

		await runTranslation(makeConfig(), fs, mockTranslate);

		// LLM should have been called once (2 keys, batch size 10)
		expect(mockTranslate).toHaveBeenCalledTimes(1);
		expect(callLog[0].targetLang).toBe('de');
		expect(callLog[0].items).toHaveLength(2);

		// Output file should exist
		expect(store.has('/locales/de/notes.json')).toBe(true);
		const output = JSON.parse(store.get('/locales/de/notes.json')!);
		expect(output.title).toBe('[de] Hello');
		expect(output.message).toBe('[de] World');
	});

	it('skips unchanged keys on second run', async () => {
		const sourceJson = JSON.stringify({ title: 'Hello', message: 'World' });
		const { fs } = makeMemFs({
			'/locales/en/notes.json': sourceJson,
		});

		const callLog: { items: TranslationItem[]; targetLang: string }[] = [];
		const mockTranslate = makeMockTranslate(callLog);

		// First run — translates everything
		await runTranslation(makeConfig(), fs, mockTranslate);
		expect(mockTranslate).toHaveBeenCalledTimes(1);

		// Second run — nothing changed, no LLM calls
		callLog.length = 0;
		mockTranslate.mockClear();
		await runTranslation(makeConfig(), fs, mockTranslate);
		expect(mockTranslate).toHaveBeenCalledTimes(0);
	});

	it('only retranslates changed keys', async () => {
		const { fs, store } = makeMemFs({
			'/locales/en/notes.json': JSON.stringify({
				title: 'Hello',
				message: 'World',
			}),
		});

		const callLog: { items: TranslationItem[]; targetLang: string }[] = [];
		const mockTranslate = makeMockTranslate(callLog);

		// First run
		await runTranslation(makeConfig(), fs, mockTranslate);
		mockTranslate.mockClear();
		callLog.length = 0;

		// Update only one key
		store.set(
			'/locales/en/notes.json',
			JSON.stringify({ title: 'Hello Updated', message: 'World' }),
		);

		// Second run — only 'title' should be retranslated
		await runTranslation(makeConfig(), fs, mockTranslate);
		expect(mockTranslate).toHaveBeenCalledTimes(1);
		expect(callLog[0].items).toHaveLength(1);
		expect(callLog[0].items[0].key).toBe('title');
	});

	it('splits large input into multiple chunks', async () => {
		// Create 25 keys with batch size 10 → should produce 3 chunks
		const sourceObj: Record<string, string> = {};
		for (let i = 0; i < 25; i++) {
			sourceObj[`key${i}`] = `value ${i}`;
		}

		const { fs } = makeMemFs({
			'/locales/en/notes.json': JSON.stringify(sourceObj),
		});

		const callLog: { items: TranslationItem[]; targetLang: string }[] = [];
		const mockTranslate = makeMockTranslate(callLog);

		await runTranslation(makeConfig({ maxBatchSize: 10 }), fs, mockTranslate);

		// 25 keys / 10 per chunk = 3 chunks
		expect(mockTranslate).toHaveBeenCalledTimes(3);
		expect(callLog[0].items).toHaveLength(10);
		expect(callLog[1].items).toHaveLength(10);
		expect(callLog[2].items).toHaveLength(5);
	});

	it('translates multiple namespaces', async () => {
		const { fs } = makeMemFs({
			'/locales/en/notes.json': JSON.stringify({ title: 'Note' }),
			'/locales/en/workspace.json': JSON.stringify({ name: 'Workspace' }),
		});

		const callLog: { items: TranslationItem[]; targetLang: string }[] = [];
		const mockTranslate = makeMockTranslate(callLog);

		await runTranslation(makeConfig(), fs, mockTranslate);

		// One call per namespace (each has 1 key, batch size 10)
		expect(mockTranslate).toHaveBeenCalledTimes(2);
	});

	it('translates multiple target languages', async () => {
		const { fs } = makeMemFs({
			'/locales/en/notes.json': JSON.stringify({ title: 'Hello' }),
		});

		const callLog: { items: TranslationItem[]; targetLang: string }[] = [];
		const mockTranslate = makeMockTranslate(callLog);

		await runTranslation(
			makeConfig({ targetLangs: ['de', 'fr'] }),
			fs,
			mockTranslate,
		);

		expect(mockTranslate).toHaveBeenCalledTimes(2);
		const langs = callLog.map((c) => c.targetLang).sort();
		expect(langs).toEqual(['de', 'fr']);
	});

	it('preserves existing unrelated keys in target file', async () => {
		const { fs, store } = makeMemFs({
			'/locales/en/notes.json': JSON.stringify({ title: 'Hello' }),
			// Target file already has an unrelated key
			'/locales/de/notes.json': JSON.stringify({ unrelated: 'Existing' }),
		});

		const mockTranslate = makeMockTranslate([]);
		await runTranslation(makeConfig(), fs, mockTranslate);

		const output = JSON.parse(store.get('/locales/de/notes.json')!);
		// New translation should be present
		expect(output.title).toBe('[de] Hello');
		// Existing unrelated key should be preserved
		expect(output.unrelated).toBe('Existing');
	});

	it('writes cache after translation', async () => {
		const { fs, store } = makeMemFs({
			'/locales/en/notes.json': JSON.stringify({ title: 'Hello' }),
		});

		const mockTranslate = makeMockTranslate([]);
		await runTranslation(makeConfig(), fs, mockTranslate);

		expect(store.has('/cache/notes.de.json')).toBe(true);
		const cache = JSON.parse(store.get('/cache/notes.de.json')!) as CacheFile;
		expect(cache['title']).toBeDefined();
		expect(cache['title'].hash).toBe(computeHash('Hello'));
		expect(cache['title'].translations['de']).toBe('[de] Hello');
	});

	it('handles nested source JSON correctly', async () => {
		const { fs, store } = makeMemFs({
			'/locales/en/notes.json': JSON.stringify({
				editor: { placeholder: 'Type here', title: 'Editor' },
			}),
		});

		const mockTranslate = makeMockTranslate([]);
		await runTranslation(makeConfig(), fs, mockTranslate);

		const output = JSON.parse(store.get('/locales/de/notes.json')!);
		expect(output.editor.placeholder).toBe('[de] Type here');
		expect(output.editor.title).toBe('[de] Editor');
	});
});
