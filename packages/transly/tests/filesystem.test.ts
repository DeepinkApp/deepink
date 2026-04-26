/* eslint-disable @cspell/spellchecker */
/**
 * Filesystem integration tests using memfs.
 *
 * These tests verify that the tool correctly reads locale files, writes
 * translated output, and reads/writes cache — all through the FsAdapter
 * interface backed by memfs.
 */
import { fs as memfsFs, vol } from 'memfs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { computeHash, readCache, writeCache } from '../src/cache.js';
import { runTranslation } from '../src/runner.js';
import { scanNamespaces } from '../src/scanner.js';
import type { CacheFile, Config, FsAdapter, TranslationItem } from '../src/types.js';

// ---------------------------------------------------------------------------
// memfs adapter
// ---------------------------------------------------------------------------

/**
 * Wraps memfs in our FsAdapter interface.
 */
function makeMemfsAdapter(): FsAdapter {
	return {
		readFile: (path) =>
			new Promise<string>((resolve, reject) => {
				memfsFs.readFile(path, 'utf-8', (err, data) => {
					if (err || data === undefined)
						reject(err ?? new Error(`ENOENT: ${path}`));
					else resolve(data as string);
				});
			}),
		writeFile: (path, data) =>
			new Promise<void>((resolve, reject) => {
				memfsFs.writeFile(path, data, 'utf-8', (err) => {
					if (err) reject(err);
					else resolve();
				});
			}),
		mkdir: (path, options) =>
			new Promise<string | undefined>((resolve, reject) => {
				memfsFs.mkdir(path, options, (err) => {
					if (err && (err as NodeJS.ErrnoException).code !== 'EEXIST')
						reject(err);
					else resolve(undefined);
				});
			}),
		readdir: (path) =>
			new Promise<string[]>((resolve, reject) => {
				memfsFs.readdir(path, (err, files) => {
					if (err || files === undefined)
						reject(err ?? new Error(`ENOENT: ${path}`));
					else resolve(files as string[]);
				});
			}),
		access: (path) =>
			new Promise<void>((resolve, reject) => {
				memfsFs.access(path, (err) => {
					if (err) reject(err);
					else resolve();
				});
			}),
	};
}

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

function makeMockTranslate() {
	return vi.fn(async (items: TranslationItem[], targetLang: string) => {
		const result: Record<string, string> = {};
		for (const item of items) {
			result[item.key] = `[${targetLang}] ${item.value}`;
		}
		return result;
	});
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
	vol.reset();
});

afterEach(() => {
	vol.reset();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Filesystem: scanNamespaces', () => {
	it('discovers JSON files in the source locale directory', async () => {
		vol.fromJSON({
			'/locales/en/notes.json': JSON.stringify({ title: 'Hello' }),
			'/locales/en/workspace.json': JSON.stringify({ name: 'Workspace' }),
		});

		const fs = makeMemfsAdapter();
		const namespaces = await scanNamespaces('/locales', 'en', fs);

		expect(namespaces).toHaveLength(2);
		const names = namespaces.map((n) => n.namespace).sort();
		expect(names).toEqual(['notes', 'workspace']);
	});

	it('ignores non-JSON files', async () => {
		vol.fromJSON({
			'/locales/en/notes.json': JSON.stringify({ title: 'Hello' }),
			'/locales/en/README.md': '# Locales',
		});

		const fs = makeMemfsAdapter();
		const namespaces = await scanNamespaces('/locales', 'en', fs);

		expect(namespaces).toHaveLength(1);
		expect(namespaces[0].namespace).toBe('notes');
	});

	it('throws when source locale directory does not exist', async () => {
		vol.fromJSON({});
		const fs = makeMemfsAdapter();
		await expect(scanNamespaces('/locales', 'en', fs)).rejects.toThrow();
	});

	it('parses JSON content correctly', async () => {
		const content = { title: 'Hello', nested: { message: 'World' } };
		vol.fromJSON({ '/locales/en/notes.json': JSON.stringify(content) });

		const fs = makeMemfsAdapter();
		const namespaces = await scanNamespaces('/locales', 'en', fs);

		expect(namespaces[0].content).toEqual(content);
	});
});

describe('Filesystem: cache read/write', () => {
	it('writes cache file to disk and reads it back', async () => {
		vol.fromJSON({ '/cache/.keep': '' });
		const fs = makeMemfsAdapter();

		const cache: CacheFile = {
			title: { hash: computeHash('Hello'), translations: { de: 'Hallo' } },
		};

		await writeCache('/cache', 'notes', 'de', cache, fs);
		const result = await readCache('/cache', 'notes', 'de', fs);

		expect(result).toEqual(cache);
	});

	it('creates cache directory if it does not exist', async () => {
		vol.fromJSON({});
		const fs = makeMemfsAdapter();

		const cache: CacheFile = {
			key: { hash: computeHash('value'), translations: { de: 'Wert' } },
		};

		// Should not throw even though /cache doesn't exist
		await expect(
			writeCache('/cache', 'notes', 'de', cache, fs),
		).resolves.not.toThrow();
	});

	it('returns empty cache when file does not exist', async () => {
		vol.fromJSON({});
		const fs = makeMemfsAdapter();
		const result = await readCache('/cache', 'notes', 'de', fs);
		expect(result).toEqual({});
	});
});

describe('Filesystem: full pipeline with memfs', () => {
	it('reads source files, translates, and writes output files', async () => {
		vol.fromJSON({
			'/locales/en/notes.json': JSON.stringify({
				title: 'Hello',
				nested: { message: 'World' },
			}),
		});

		const fs = makeMemfsAdapter();
		const mockTranslate = makeMockTranslate();

		await runTranslation(makeConfig(), fs, mockTranslate);

		// Output file should exist
		const outputRaw = await fs.readFile('/locales/de/notes.json', 'utf-8');
		const output = JSON.parse(outputRaw);

		expect(output.title).toBe('[de] Hello');
		expect(output.nested.message).toBe('[de] World');
	});

	it('writes cache file after successful translation', async () => {
		vol.fromJSON({
			'/locales/en/notes.json': JSON.stringify({ title: 'Hello' }),
		});

		const fs = makeMemfsAdapter();
		await runTranslation(makeConfig(), fs, makeMockTranslate());

		const cacheRaw = await fs.readFile('/cache/notes.de.json', 'utf-8');
		const cache = JSON.parse(cacheRaw) as CacheFile;

		expect(cache['title']).toBeDefined();
		expect(cache['title'].hash).toBe(computeHash('Hello'));
		expect(cache['title'].translations['de']).toBe('[de] Hello');
	});

	it('does not call LLM on second run when nothing changed', async () => {
		vol.fromJSON({
			'/locales/en/notes.json': JSON.stringify({ title: 'Hello' }),
		});

		const fs = makeMemfsAdapter();
		const mockTranslate = makeMockTranslate();

		await runTranslation(makeConfig(), fs, mockTranslate);
		mockTranslate.mockClear();

		await runTranslation(makeConfig(), fs, mockTranslate);
		expect(mockTranslate).not.toHaveBeenCalled();
	});

	it('only retranslates updated keys on second run', async () => {
		vol.fromJSON({
			'/locales/en/notes.json': JSON.stringify({
				title: 'Hello',
				message: 'World',
			}),
		});

		const fs = makeMemfsAdapter();
		const mockTranslate = makeMockTranslate();

		// First run
		await runTranslation(makeConfig(), fs, mockTranslate);
		mockTranslate.mockClear();

		// Update source file — only 'title' changed
		await fs.writeFile(
			'/locales/en/notes.json',
			JSON.stringify({ title: 'Hello Updated', message: 'World' }),
			'utf-8',
		);

		const callLog: { items: TranslationItem[] }[] = [];
		const retryTranslate = vi.fn(
			async (items: TranslationItem[], targetLang: string) => {
				callLog.push({ items: [...items] });
				const result: Record<string, string> = {};
				for (const item of items) {
					result[item.key] = `[${targetLang}] ${item.value}`;
				}
				return result;
			},
		);

		await runTranslation(makeConfig(), fs, retryTranslate);

		expect(retryTranslate).toHaveBeenCalledTimes(1);
		expect(callLog[0].items).toHaveLength(1);
		expect(callLog[0].items[0].key).toBe('title');
	});

	it('handles multiple namespaces correctly', async () => {
		vol.fromJSON({
			'/locales/en/notes.json': JSON.stringify({ title: 'Note' }),
			'/locales/en/workspace.json': JSON.stringify({ name: 'Workspace' }),
		});

		const fs = makeMemfsAdapter();
		await runTranslation(makeConfig(), fs, makeMockTranslate());

		const notesRaw = await fs.readFile('/locales/de/notes.json', 'utf-8');
		const workspaceRaw = await fs.readFile('/locales/de/workspace.json', 'utf-8');

		expect(JSON.parse(notesRaw).title).toBe('[de] Note');
		expect(JSON.parse(workspaceRaw).name).toBe('[de] Workspace');
	});

	it('preserves existing target file keys not in source', async () => {
		vol.fromJSON({
			'/locales/en/notes.json': JSON.stringify({ title: 'Hello' }),
			'/locales/de/notes.json': JSON.stringify({ legacy: 'Altes Feld' }),
		});

		const fs = makeMemfsAdapter();
		await runTranslation(makeConfig(), fs, makeMockTranslate());

		const outputRaw = await fs.readFile('/locales/de/notes.json', 'utf-8');
		const output = JSON.parse(outputRaw);

		expect(output.title).toBe('[de] Hello');
		expect(output.legacy).toBe('Altes Feld');
	});
});
