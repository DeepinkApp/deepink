import { Paragraph } from 'mdast';
import { u } from 'unist-builder';

import { parseMarkdownToAST, serializeMarkdownTree } from './markdownParser';

const createBulletList = (value: string) =>
	u('list', {
		ordered: false,
		start: null,
		spread: false,
		children: [
			u('listItem', {
				checked: null,
				spread: false,
				children: [
					u('paragraph', {
						children: [u('text', { value })],
					}),
				],
			}),
		],
	});

describe('AST serialization', () => {
	test('2 paragraphs have 1 empty line', () => {
		expect(
			serializeMarkdownTree(
				u('root', {
					children: [
						u('paragraph', { children: [u('text', { value: 'Hello' })] }),
						u('paragraph', { children: [u('text', { value: 'World' })] }),
					] satisfies Paragraph[],
				}),
			),
		).toBe('Hello\n\nWorld\n');
	});

	test('Empty paragraph is considered as additional empty line + 2 lines around', () => {
		expect(
			serializeMarkdownTree(
				u('root', {
					children: [
						u('paragraph', { children: [u('text', { value: 'Hello' })] }),
						u('paragraph', { children: [] }),
						u('paragraph', { children: [u('text', { value: 'World' })] }),
					] satisfies Paragraph[],
				}),
			),
		).toBe(`Hello${'\n'.repeat(3)}\nWorld\n`);
	});

	test('3 empty paragraphs must be serialized as 5 empty lines', () => {
		expect(
			serializeMarkdownTree(
				u('root', {
					children: [
						u('paragraph', { children: [u('text', { value: 'Hello' })] }),
						u('paragraph', { children: [] }),
						u('paragraph', { children: [] }),
						u('paragraph', { children: [] }),
						u('paragraph', { children: [u('text', { value: 'World' })] }),
					] satisfies Paragraph[],
				}),
			),
		).toBe(`Hello${'\n'.repeat(5)}\nWorld\n`);
	});

	test('Same-kind lists separated by empty paragraphs use distinct markers', () => {
		const output = serializeMarkdownTree({
			type: 'root',
			children: [
				createBulletList('First'),
				u('paragraph', { children: [] }),
				createBulletList('Second'),
				u('paragraph', { children: [] }),
				u('paragraph', { children: [] }),
				createBulletList('Third'),
			],
		});

		const listItemMarkers = output
			.split('\n')
			.filter(
				(line) =>
					line.endsWith('First') ||
					line.endsWith('Second') ||
					line.endsWith('Third'),
			)
			.map((line) => line[0]);

		expect(listItemMarkers).toEqual(['-', '*', '-']);
		expect(
			parseMarkdownToAST(output).children.filter((node) => node.type === 'list'),
		).toHaveLength(3);
	});

	test('Ordered lists separated by empty paragraphs use distinct delimiters', () => {
		const createOrderedList = (start: number, value: string) =>
			u('list', {
				ordered: true,
				start,
				spread: false,
				children: [
					u('listItem', {
						checked: null,
						spread: false,
						children: [
							u('paragraph', {
								children: [u('text', { value })],
							}),
						],
					}),
				],
			});
		const output = serializeMarkdownTree({
			type: 'root',
			children: [
				createOrderedList(3, 'First'),
				u('paragraph', { children: [] }),
				createOrderedList(4, 'Second'),
			],
		});

		expect(output).toContain('3. First');
		expect(output).toContain('4) Second');
		expect(
			parseMarkdownToAST(output).children.filter((node) => node.type === 'list'),
		).toHaveLength(2);
	});

	test('Quote with 3 empty paragraphs must contain 5 empty lines', () => {
		expect(
			serializeMarkdownTree({
				type: 'root',
				children: [
					{
						type: 'blockquote',
						children: [
							{
								type: 'paragraph',
								children: [
									{
										type: 'text',
										value: 'Hello',
									},
								],
							},
							u('paragraph', { children: [] }),
							u('paragraph', { children: [] }),
							u('paragraph', { children: [] }),
							{
								type: 'paragraph',
								children: [
									{
										type: 'text',
										value: 'World',
									},
								],
							},
						],
					},
				],
			}),
		).toBe(`> Hello${`\n>`.repeat(5)}\n> World\n`);
	});

	test('Nested quote with 3 empty paragraphs must contain 5 empty lines', () => {
		expect(
			serializeMarkdownTree({
				type: 'root',
				children: [
					{
						type: 'blockquote',
						children: [
							{
								type: 'paragraph',
								children: [
									{
										type: 'text',
										value: 'Hello',
									},
								],
							},
							u('paragraph', { children: [] }),
							u('paragraph', { children: [] }),
							u('paragraph', { children: [] }),
							{
								type: 'blockquote',
								children: [
									{
										type: 'paragraph',
										children: [
											{
												type: 'text',
												value: 'Hello',
											},
										],
									},
									u('paragraph', { children: [] }),
									u('paragraph', { children: [] }),
									u('paragraph', { children: [] }),
									{
										type: 'paragraph',
										children: [
											{
												type: 'text',
												value: 'World',
											},
										],
									},
								],
							},
						],
					},
				],
			}),
		).toBe(`> Hello${`\n>`.repeat(5)}\n> > Hello${'\n> >'.repeat(5)}\n> > World\n`);
	});
});
