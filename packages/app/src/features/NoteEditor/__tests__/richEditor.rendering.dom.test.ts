import { readFileSync } from 'fs';
import path from 'path';
import { screen, within } from '@testing-library/react';

import { renderRichEditor } from './utils/renderRichEditor';

test('Renders markdown correctly', async () => {
	const markdown = readFileSync(
		path.resolve(path.dirname(__filename), 'resources/example.md'),
		'utf8',
	);
	await renderRichEditor({ value: markdown });

	const editor = screen.getByRole('textbox');

	// Text formatting in a paragraph
	const [paragraph] = within(editor).getAllByRole('paragraph');
	expect(paragraph).toHaveTextContent(
		'This is a regular paragraph with bold text, italic text, strikethrough text.',
	);
	expect(paragraph.querySelector('b')).toHaveTextContent('bold text');
	expect(within(paragraph).getByRole('emphasis')).toHaveTextContent('italic text');
	expect(within(paragraph).getByRole('deletion')).toHaveTextContent(
		'strikethrough text',
	);

	// Horizontal rule
	expect(within(editor).getByRole('separator')).toBeInTheDocument();

	// Headings
	expect(
		within(editor).getByRole('heading', {
			level: 1,
			name: 'Heading 1',
		}),
	).toBeInTheDocument();
	expect(
		within(editor).getByRole('heading', {
			level: 2,
			name: 'Heading 2',
		}),
	).toBeInTheDocument();
	expect(
		within(editor).getByRole('heading', {
			level: 3,
			name: 'Heading 3',
		}),
	).toBeInTheDocument();

	// Blockquote
	const [outerQuote, nestedQuote] = within(editor).getAllByRole('blockquote');
	expect(outerQuote).toContainElement(nestedQuote);
	expect(outerQuote).toHaveTextContent(
		'This is a blockquote. It can span multiple lines.',
	);
	expect(nestedQuote).toHaveTextContent('The nested quote.');

	// Code
	const [inlineCode, blockCode] = within(editor).getAllByRole('code');

	expect(inlineCode).toHaveTextContent('const value = 42');
	expect(inlineCode.closest('p')).toHaveTextContent('Inline code: const value = 42');

	expect(blockCode.closest('p')).toBeNull();
	expect(blockCode).toHaveTextContent('console.log("World");');
	expect(blockCode).toHaveAttribute('data-language', 'ts');

	// Link
	const link = within(editor).getByRole('link');
	expect(link).toHaveTextContent('Markdown Guide');
	expect(link).toHaveAttribute('href', 'https://example.com');

	// Image
	const img = await within(editor).findByRole('img');
	expect(img).toHaveAttribute('src', 'https://example.com/sample.png');
	expect(img).toHaveAttribute('alt', 'Sample Image');

	// Lists
	expect(within(editor).getAllByRole('list')).toHaveLength(2);

	const items = within(editor).getAllByRole('listitem');
	expect(items).toHaveLength(4);

	const [first, second, nested, third] = items;
	expect(first).toHaveTextContent('First item');
	expect(second).toHaveTextContent('Second item');
	expect(nested).toHaveTextContent('Nested item');
	expect(third).toHaveTextContent('Third item');

	// Second item contains a nested item
	expect(within(second).getByRole('list')).toContainElement(nested);

	// Table
	const table = within(editor).getByRole('table');
	expect(table).toBeInTheDocument();
	const rows = within(table).getAllByRole('row');
	expect(rows).toHaveLength(2);

	expect(within(rows[0]).getByRole('cell', { name: 'Name' })).toBeInTheDocument();
	expect(within(rows[0]).getByRole('cell', { name: 'Role' })).toBeInTheDocument();

	expect(within(rows[1]).getByRole('cell', { name: 'Alice' })).toBeInTheDocument();
	expect(within(rows[1]).getByRole('cell', { name: 'Admin' })).toBeInTheDocument();
});

test('Renders a checklist with checked and unchecked items', async () => {
	await renderRichEditor({
		value: `- [x] First item
  - [ ] Nested item
	- [x] Deep nested item
- [ ] Second item`,
	});

	const checkboxes = within(screen.getByRole('textbox')).getAllByRole('checkbox');
	const [firstItem, nestedItem, deepNestedItem, secondItem] = checkboxes;
	expect(checkboxes).toHaveLength(4);

	// First item contains nested list
	expect(firstItem).toHaveTextContent('First item');
	expect(firstItem).toBeChecked();

	const [firstItemNestedList] = within(firstItem).getAllByRole('list');
	expect(firstItemNestedList).toContainElement(nestedItem);

	// Nested item contains deep nested list
	expect(nestedItem).toHaveTextContent('Nested item');
	expect(nestedItem).not.toBeChecked();

	const nestedItemList = within(nestedItem).getByRole('list');
	expect(nestedItemList).toContainElement(deepNestedItem);

	// Deep nested item
	expect(deepNestedItem).toHaveTextContent('Deep nested item');
	expect(deepNestedItem).toBeChecked();

	// Second item
	expect(secondItem).toHaveTextContent('Second item');
	expect(secondItem).not.toBeChecked();
});

test('Renders a mixed list with regular and checkbox items correctly', async () => {
	await renderRichEditor({
		value: `- [x] First item
  - Nested simple item
- [ ] Second item`,
	});

	const checkboxes = screen.getAllByRole('checkbox');
	expect(checkboxes).toHaveLength(2);
	const [first, second] = checkboxes;

	expect(first).toHaveTextContent('First item');
	expect(first).toBeChecked();

	expect(second).toHaveTextContent('Second item');
	expect(second).not.toBeChecked();

	// Nested item - regular, not checkbox
	const nestedList = within(first).getByRole('list');
	const nestedItem = within(nestedList).getByRole('listitem');

	expect(nestedItem).toHaveTextContent('Nested simple item');
	expect(within(nestedItem).queryByRole('checkbox')).toBeNull();
});
