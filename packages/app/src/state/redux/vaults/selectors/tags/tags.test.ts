/* eslint-disable @cspell/spellchecker */

import { TagNode } from '../../vaults';

import { orderBy } from './sort';

const sortTagsLexicographically = orderBy((t: TagNode) => [t.name, t.id]);

describe('orderBy', () => {
	test('must order lexicographically by ascending', () => {
		expect(
			[
				{ id: 'foo', name: 'foo' },
				{ id: 'bar', name: 'bar' },
				{ id: 'baz', name: 'baz' },
			]
				.sort(orderBy((t) => [t.name, t.id]))
				.map((i) => i.id),
		).toEqual(['bar', 'baz', 'foo']);
	});

	test('secondary key must be used when first keys is equal', () => {
		expect(
			[
				{ id: 'foo', name: 'foo' },
				{ id: 'bar', name: 'foo' },
				{ id: 'baz', name: 'foo' },
			]
				.sort(orderBy((t) => [t.name, t.id]))
				.map((i) => i.id),
		).toEqual(['bar', 'baz', 'foo']);
	});

	test('numeric keys must be considered', () => {
		expect(
			[
				{ id: 'foo', name: 'foo', order: 1 },
				{ id: 'bar', name: 'foo', order: 2 },
				{ id: 'baz', name: 'foo', order: 3 },
			]
				.sort(orderBy((t) => [t.name, t.order]))
				.map((i) => i.id),
		).toEqual(['foo', 'bar', 'baz']);
	});
});

describe('Tags sorting', () => {
	describe('Lexicographical sorting', () => {
		test('A->Z order', () => {
			expect(
				(
					[
						{ id: 'foo', name: 'foo' },
						{ id: 'bar', name: 'bar' },
						{ id: 'baz', name: 'baz' },
					] as TagNode[]
				).sort(sortTagsLexicographically),
			).toEqual(
				['bar', 'baz', 'foo'].map((text) =>
					expect.objectContaining({ name: text }),
				),
			);
		});

		test('A->Z order for other locales', () => {
			expect(
				(
					[
						{ id: 'foo', name: 'Банан' },
						{ id: 'bar', name: 'Яблоко' },
						{ id: 'baz', name: 'Арбуз' },
					] as TagNode[]
				).sort(sortTagsLexicographically),
			).toEqual(
				['Арбуз', 'Банан', 'Яблоко'].map((text) =>
					expect.objectContaining({ name: text }),
				),
			);
		});

		test('Multi locales order', () => {
			expect(
				[
					'Арбуз',
					'Яблоко',
					'Банан',
					'!!!',
					'123',
					'@#$',
					'Apple',
					'Watermelon',
					'Banana',
				]
					.map(
						(text) =>
							({
								id: text,
								name: text,
							}) as TagNode,
					)
					.sort(sortTagsLexicographically),
			).toEqual(
				[
					'!!!',
					'@#$',
					'123',
					'Apple',
					'Banana',
					'Watermelon',
					'Арбуз',
					'Банан',
					'Яблоко',
				].map((text) => expect.objectContaining({ name: text })),
			);
		});

		test('Order is determined', () => {
			const tags = [
				{ id: 'foo', name: 'foo' },
				{ id: 'bar', name: 'bar' },
				{ id: 'baz1', name: 'baz' },
				{ id: 'baz2', name: 'baz' },
			] as TagNode[];

			for (let i = 1; i <= 10; i++) {
				const shuffledArray = tags
					.slice()
					.sort(() => (Math.random() > 0.5 ? 1 : -1));
				expect(shuffledArray.sort(sortTagsLexicographically)).toEqual(
					['bar', 'baz1', 'baz2', 'foo'].map((text) =>
						expect.objectContaining({ id: text }),
					),
				);
			}
		});
	});
});
