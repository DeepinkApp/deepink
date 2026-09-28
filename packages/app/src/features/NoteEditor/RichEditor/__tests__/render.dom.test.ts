import { readFileSync } from 'fs';
import path from 'path';
import { screen, within } from '@testing-library/react';

import { renderRichEditor } from './utils/renderRichEditor';
import { textFormatClasses } from './utils/richEditorFixtures';

test('Editor updates when value changes', async () => {
	const editor = await renderRichEditor({ value: `# Big text` });

	expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Big text');

	// Run component rerender with new value
	await editor.rerender({ value: `### Not so big text` });

	expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
		'Not so big text',
	);

	// The old header was removed
	expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
});

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

	expect(within(paragraph).getByText('bold text')).toHaveClass(textFormatClasses.bold);
	expect(within(paragraph).getByText('italic text')).toHaveClass(
		textFormatClasses.italic,
	);
	expect(within(paragraph).getByText('strikethrough text')).toHaveClass(
		textFormatClasses.strikethrough,
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
	await expect
		.poll(() => within(editor).findByRole('img'))
		.toSatisfy((img) => {
			expect(img).toHaveAttribute('src', 'https://example.com/sample.png');
			expect(img).toHaveAttribute('alt', 'Sample Image');

			return true;
		});

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
