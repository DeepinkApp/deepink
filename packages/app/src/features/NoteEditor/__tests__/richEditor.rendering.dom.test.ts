import { readFileSync } from 'fs';
import path from 'path';
import { screen, within } from '@testing-library/react';

import { renderRichEditor } from './utils/renderRichEditor';

test('Renders simple markdown correctly', async () => {
	const markdown = readFileSync(
		path.resolve(path.dirname(__filename), 'base.md'),
		'utf8',
	);
	await renderRichEditor({ value: markdown });

	// Text formatting in a paragraph
	const [paragraph] = screen.getAllByRole('paragraph');
	expect(paragraph).toHaveTextContent(
		'This is a regular paragraph with bold text, italic text, strikethrough text.',
	);
	expect(paragraph.querySelector('b')).toHaveTextContent('bold text');
	expect(within(paragraph).getByRole('emphasis')).toHaveTextContent('italic text');
	expect(within(paragraph).getByRole('deletion')).toHaveTextContent(
		'strikethrough text',
	);

	// Horizontal rule
	expect(
		within(screen.getByRole('textbox')).getByRole('separator'),
	).toBeInTheDocument();

	// Headings
	expect(
		screen.getByRole('heading', { level: 1, name: 'Heading 1' }),
	).toBeInTheDocument();
	expect(
		screen.getByRole('heading', { level: 2, name: 'Heading 2' }),
	).toBeInTheDocument();
	expect(
		screen.getByRole('heading', { level: 3, name: 'Heading 3' }),
	).toBeInTheDocument();

	// Blockquote
	const [outerQuote, nestedQuote] = screen.getAllByRole('blockquote');
	expect(outerQuote).toContainElement(nestedQuote);
	expect(outerQuote).toHaveTextContent(
		'This is a blockquote. It can span multiple lines.',
	);
	expect(nestedQuote).toHaveTextContent('The nested quote.');

	// Code
	const [inlineCode, blockCode] = screen.getAllByRole('code');

	expect(inlineCode).toHaveTextContent('const value = 42');
	expect(inlineCode.closest('p')).toHaveTextContent('Inline code: const value = 42');

	expect(blockCode.closest('p')).toBeNull();
	expect(blockCode).toHaveTextContent('console.log("World");');
	expect(blockCode).toHaveAttribute('data-language', 'ts');

	// Link
	const link = screen.getByRole('link');
	expect(link).toHaveTextContent('Markdown Guide');
	expect(link).toHaveAttribute('href', 'https://example.com');

	// Image
	const img = await screen.findByRole('img');
	expect(img).toHaveAttribute('src', 'https://example.com/sample.png');
	expect(img).toHaveAttribute('alt', 'Sample Image');

	// List
	expect(screen.getByRole('list')).toBeInTheDocument();
	const items = within(screen.getByRole('list')).getAllByRole('listitem');

	expect(items).toHaveLength(2);
	expect(items[0]).toHaveTextContent('List item');
	expect(items[1]).toHaveTextContent('Next item');

	// Table
	const table = screen.getByRole('table');
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
- [ ] Second item`,
	});

	const checkboxList = within(screen.getByRole('textbox')).getAllByRole('checkbox');
	expect(checkboxList).toHaveLength(3);
	expect(checkboxList[0]).toHaveTextContent('First item');
	expect(checkboxList[0]).toBeChecked();

	expect(checkboxList[1]).toHaveTextContent('Nested item');
	expect(checkboxList[1]).not.toBeChecked();

	expect(checkboxList[2]).toHaveTextContent('Second item');
	expect(checkboxList[2]).not.toBeChecked();
});
