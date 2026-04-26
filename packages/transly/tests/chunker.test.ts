import { describe, expect, it } from 'vitest';

import { chunkItems, DEFAULT_MAX_BATCH_SIZE } from '../src/chunker.js';
import type { TranslationItem } from '../src/types.js';

function makeItems(count: number): TranslationItem[] {
	return Array.from({ length: count }, (_, i) => ({
		key: `key.${i}`,
		value: `value ${i}`,
	}));
}

describe('chunkItems', () => {
	it('returns empty array for empty input', () => {
		expect(chunkItems([], 10)).toEqual([]);
	});

	it('returns a single chunk when items fit within maxBatchSize', () => {
		const items = makeItems(5);
		const chunks = chunkItems(items, 10);
		expect(chunks).toHaveLength(1);
		expect(chunks[0]).toHaveLength(5);
	});

	it('returns exactly one chunk when items equal maxBatchSize', () => {
		const items = makeItems(10);
		const chunks = chunkItems(items, 10);
		expect(chunks).toHaveLength(1);
		expect(chunks[0]).toHaveLength(10);
	});

	it('splits into two chunks when items exceed maxBatchSize by one', () => {
		const items = makeItems(11);
		const chunks = chunkItems(items, 10);
		expect(chunks).toHaveLength(2);
		expect(chunks[0]).toHaveLength(10);
		expect(chunks[1]).toHaveLength(1);
	});

	it('splits 100 items into 4 chunks of 25', () => {
		const items = makeItems(100);
		const chunks = chunkItems(items, 25);
		expect(chunks).toHaveLength(4);
		for (const chunk of chunks) {
			expect(chunk).toHaveLength(25);
		}
	});

	it('handles uneven split correctly', () => {
		const items = makeItems(7);
		const chunks = chunkItems(items, 3);
		expect(chunks).toHaveLength(3);
		expect(chunks[0]).toHaveLength(3);
		expect(chunks[1]).toHaveLength(3);
		expect(chunks[2]).toHaveLength(1);
	});

	it('uses DEFAULT_MAX_BATCH_SIZE when no size provided', () => {
		const items = makeItems(DEFAULT_MAX_BATCH_SIZE + 1);
		const chunks = chunkItems(items);
		expect(chunks).toHaveLength(2);
		expect(chunks[0]).toHaveLength(DEFAULT_MAX_BATCH_SIZE);
		expect(chunks[1]).toHaveLength(1);
	});

	it('throws for maxBatchSize of 0', () => {
		expect(() => chunkItems(makeItems(5), 0)).toThrow(
			'maxBatchSize must be a positive integer',
		);
	});

	it('throws for negative maxBatchSize', () => {
		expect(() => chunkItems(makeItems(5), -1)).toThrow(
			'maxBatchSize must be a positive integer',
		);
	});

	it('preserves item content across chunks', () => {
		const items = makeItems(5);
		const chunks = chunkItems(items, 3);
		const allItems = chunks.flat();
		expect(allItems).toEqual(items);
	});

	it('handles maxBatchSize of 1 (one item per chunk)', () => {
		const items = makeItems(3);
		const chunks = chunkItems(items, 1);
		expect(chunks).toHaveLength(3);
		for (const chunk of chunks) {
			expect(chunk).toHaveLength(1);
		}
	});
});
