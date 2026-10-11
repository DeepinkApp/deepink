import { List } from 'mdast';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

import { fillGapsWithParagraphs } from './remarkPreserveBlankLines';

export const markdownProcessor = unified().use(remarkParse);

test('Must not to add paragraphs for text with no gaps', () => {
	const tree = markdownProcessor.parse('Hello\nWorld');
	expect(tree.children).toHaveLength(1);
	expect(fillGapsWithParagraphs(tree).children).toHaveLength(1);
});

test('Must not to add paragraphs for one line gap', () => {
	const tree = markdownProcessor.parse('Hello\n\nWorld');
	expect(tree.children).toHaveLength(2);
	expect(fillGapsWithParagraphs(tree).children).toHaveLength(2);
});

test('Must not to add paragraphs for gap in 2 lines', () => {
	const tree = markdownProcessor.parse('Hello\n\n\nWorld');
	expect(tree.children).toHaveLength(2);
	expect(fillGapsWithParagraphs(tree).children).toHaveLength(2);
});

test('Must add 8 paragraphs for gap in 10 lines', () => {
	const tree = markdownProcessor.parse('Hello\n' + '\n'.repeat(10) + 'World');
	expect(tree.children).toHaveLength(2);
	expect(fillGapsWithParagraphs(tree).children).toHaveLength(2 + 8);
});

test('Must not insert paragraphs between list items for large source gaps', () => {
	const tree = markdownProcessor.parse('- First\n' + '\n'.repeat(10) + '- Second');

	const list = fillGapsWithParagraphs(tree).children[0] as List;
	expect(list.type).toBe('list');

	expect(list.children).toHaveLength(2);
	expect(list.children).toStrictEqual(
		Array(2).fill(expect.objectContaining({ type: 'listItem' })),
	);
});

// TODO: implement lines preservation
test.fails('Preserve lines for document with no text', () => {
	const tree = markdownProcessor.parse('\n'.repeat(10));
	expect(tree.children).toHaveLength(0);
	expect(fillGapsWithParagraphs(tree).children).toHaveLength(5);
});

test.fails('Preserve lines at start', () => {
	const tree = markdownProcessor.parse('\n'.repeat(10) + '\nText');
	expect(tree.children).toHaveLength(1);
	expect(fillGapsWithParagraphs(tree).children).toHaveLength(6);
});

test.fails('Preserve lines at end', () => {
	const tree = markdownProcessor.parse('Text\n' + '\n'.repeat(10));
	expect(tree.children).toHaveLength(1);
	expect(fillGapsWithParagraphs(tree).children).toHaveLength(6);
});
