import { describe, expect, it } from 'vitest';

import { computeHash, getChangedKeys, readCache, writeCache } from '../src/cache.js';
import type { CacheFile, FsAdapter } from '../src/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates an in-memory FsAdapter backed by a simple Map.
 */
function makeMemFs(initial: Record<string, string> = {}): FsAdapter {
	const store = new Map<string, string>(Object.entries(initial));

	return {
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
		async readdir() {
			return [];
		},
		async access(path) {
			if (!store.has(path)) throw new Error(`ENOENT: ${path}`);
		},
	};
}

// ---------------------------------------------------------------------------
// computeHash
// ---------------------------------------------------------------------------

describe('computeHash', () => {
	it('returns a 64-character hex string (SHA-256)', () => {
		const hash = computeHash('hello');
		expect(hash).toHaveLength(64);
		expect(hash).toMatch(/^[0-9a-f]+$/);
	});

	it('returns the same hash for the same input', () => {
		expect(computeHash('hello')).toBe(computeHash('hello'));
	});

	it('returns different hashes for different inputs', () => {
		expect(computeHash('hello')).not.toBe(computeHash('world'));
	});

	it('is sensitive to whitespace', () => {
		expect(computeHash('hello')).not.toBe(computeHash('hello '));
	});

	it('handles empty string', () => {
		const hash = computeHash('');
		expect(hash).toHaveLength(64);
	});
});

// ---------------------------------------------------------------------------
// readCache / writeCache
// ---------------------------------------------------------------------------

describe('readCache', () => {
	it('returns empty object when cache file does not exist', async () => {
		const fs = makeMemFs();
		const result = await readCache('/cache', 'features', 'de', fs);
		expect(result).toEqual({});
	});

	it('reads and parses an existing cache file', async () => {
		const cacheData: CacheFile = {
			greeting: {
				hash: computeHash('Hello'),
				translations: { de: 'Hallo' },
			},
		};
		const fs = makeMemFs({
			'/cache/features.de.json': JSON.stringify(cacheData),
		});
		const result = await readCache('/cache', 'features', 'de', fs);
		expect(result).toEqual(cacheData);
	});

	it('throws on malformed JSON in cache file', async () => {
		const fs = makeMemFs({ '/cache/features.de.json': 'not-json{{{' });
		await expect(readCache('/cache', 'features', 'de', fs)).rejects.toThrow();
	});
});

describe('writeCache', () => {
	it('writes cache as formatted JSON', async () => {
		const fs = makeMemFs();
		const cache: CacheFile = {
			greeting: {
				hash: computeHash('Hello'),
				translations: { de: 'Hallo' },
			},
		};
		await writeCache('/cache', 'features', 'de', cache, fs);
		const written = await fs.readFile('/cache/features.de.json', 'utf-8');
		expect(JSON.parse(written)).toEqual(cache);
	});

	it('round-trips: write then read returns same data', async () => {
		const fs = makeMemFs();
		const cache: CacheFile = {
			title: {
				hash: computeHash('Hello'),
				translations: { de: 'Hallo', fr: 'Bonjour' },
			},
			'nested.message': {
				hash: computeHash('World'),
				translations: { de: 'Welt' },
			},
		};
		await writeCache('/cache', 'ns', 'de', cache, fs);
		const result = await readCache('/cache', 'ns', 'de', fs);
		expect(result).toEqual(cache);
	});
});

// ---------------------------------------------------------------------------
// getChangedKeys
// ---------------------------------------------------------------------------

describe('getChangedKeys', () => {
	it('returns all keys when cache is empty', () => {
		const flat = { title: 'Hello', message: 'World' };
		const changed = getChangedKeys(flat, {}, 'de');
		expect(changed).toEqual(expect.arrayContaining(['title', 'message']));
		expect(changed).toHaveLength(2);
	});

	it('returns no keys when all are cached with correct hashes', () => {
		const flat = { title: 'Hello' };
		const cache: CacheFile = {
			title: { hash: computeHash('Hello'), translations: { de: 'Hallo' } },
		};
		const changed = getChangedKeys(flat, cache, 'de');
		expect(changed).toHaveLength(0);
	});

	it('returns key when hash has changed', () => {
		const flat = { title: 'Hello Updated' };
		const cache: CacheFile = {
			title: { hash: computeHash('Hello'), translations: { de: 'Hallo' } },
		};
		const changed = getChangedKeys(flat, cache, 'de');
		expect(changed).toContain('title');
	});

	it('returns key when target language translation is missing', () => {
		const flat = { title: 'Hello' };
		const cache: CacheFile = {
			title: { hash: computeHash('Hello'), translations: { fr: 'Bonjour' } },
		};
		// Cache has 'fr' but not 'de'
		const changed = getChangedKeys(flat, cache, 'de');
		expect(changed).toContain('title');
	});

	it('does not return key when another language is missing but target is present', () => {
		const flat = { title: 'Hello' };
		const cache: CacheFile = {
			title: { hash: computeHash('Hello'), translations: { de: 'Hallo' } },
		};
		// Only checking 'de' — should be fine
		const changed = getChangedKeys(flat, cache, 'de');
		expect(changed).toHaveLength(0);
	});

	it('returns only changed keys in a mixed scenario', () => {
		const flat = {
			title: 'Hello', // unchanged
			message: 'World Updated', // hash changed
			newKey: 'New', // not in cache
		};
		const cache: CacheFile = {
			title: { hash: computeHash('Hello'), translations: { de: 'Hallo' } },
			message: { hash: computeHash('World'), translations: { de: 'Welt' } },
		};
		const changed = getChangedKeys(flat, cache, 'de');
		expect(changed).not.toContain('title');
		expect(changed).toContain('message');
		expect(changed).toContain('newKey');
	});
});
