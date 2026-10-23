import { page } from 'vitest/browser';

// @ts-expect-error import file as raw text
import markdown from './resources/example.md?raw';
import { renderRichEditorInDOM } from './utils/renderEditorInDOM';
import { textFormatClasses } from './utils/richEditorFixtures';

test('Editor updates when value changes', async () => {
	const editor = await renderRichEditorInDOM({ value: `# Big text` });

	expect(page.getByRole('heading', { level: 1 })).toHaveTextContent('Big text');

	// Run component rerender with new value
	await editor.render({ value: `### Not so big text` });

	expect(page.getByRole('heading', { level: 3 })).toHaveTextContent('Not so big text');

	// The previous header is removed
	expect(page.getByRole('heading', { level: 1 })).not.toBeInTheDocument();
});

test('Renders markdown correctly', async () => {
	await renderRichEditorInDOM({ value: markdown });

	const editor = page.getByRole('textbox');

	// Text formatting in a paragraph
	const paragraph = editor.getByRole('paragraph').first();
	expect(paragraph).toHaveTextContent(
		'This is a regular paragraph with bold text, italic text, strikethrough text.',
	);

	expect(paragraph.getByText('bold text')).toHaveClass(textFormatClasses.bold);
	expect(paragraph.getByText('italic text')).toHaveClass(textFormatClasses.italic);
	expect(paragraph.getByText('strikethrough text')).toHaveClass(
		textFormatClasses.strikethrough,
	);

	// Horizontal rule
	expect(editor.getByRole('separator')).toBeInTheDocument();

	// Headings
	expect(
		editor.getByRole('heading', {
			level: 1,
			name: 'Heading 1',
		}),
	).toBeInTheDocument();
	expect(
		editor.getByRole('heading', {
			level: 2,
			name: 'Heading 2',
		}),
	).toBeInTheDocument();
	expect(
		editor.getByRole('heading', {
			level: 3,
			name: 'Heading 3',
		}),
	).toBeInTheDocument();

	// Blockquote
	const [outerQuote, nestedQuote] = editor.getByRole('blockquote').all();
	expect(outerQuote).toContainElement(nestedQuote.element());
	expect(outerQuote).toHaveTextContent(
		'This is a blockquote. It can span multiple lines.',
	);
	expect(nestedQuote).toHaveTextContent('The nested quote.');

	// Code
	const [inlineCode, blockCode] = editor.getByRole('code').all();

	expect(inlineCode).toHaveTextContent('const value = 42');
	expect(inlineCode.element().closest('p')).toHaveTextContent(
		'Inline code: const value = 42',
	);

	expect(blockCode.element().closest('p')).toBeNull();
	expect(blockCode).toHaveTextContent('console.log("World");');
	expect(blockCode).toHaveAttribute('data-language', 'ts');

	// Link
	const link = editor.getByRole('link');
	expect(link).toHaveTextContent('Markdown Guide');
	expect(link).toHaveAttribute('href', 'https://example.com');

	// Image
	await expect
		.poll(() => editor.getByRole('img'))
		.toSatisfy((img) => {
			expect(img).toBeInTheDocument();
			expect(img).toHaveAttribute('src', 'https://example.com/sample.png');
			expect(img).toHaveAttribute('alt', 'Sample Image');

			return true;
		});

	// Lists
	expect(editor.getByRole('list')).toHaveLength(2);

	const items = editor.getByRole('listitem');
	expect(items).toHaveLength(4);

	const [first, second, nested, third] = items.all();
	expect(first).toHaveTextContent('First item');
	expect(second).toHaveTextContent('Second item');
	expect(nested).toHaveTextContent('Nested item');
	expect(third).toHaveTextContent('Third item');

	// Second item contains a nested item
	expect(second.getByRole('list')).toContainElement(nested.element());

	// Table
	const table = editor.getByRole('table');
	expect(table).toBeInTheDocument();
	const rows = table.getByRole('row');
	expect(rows).toHaveLength(2);

	expect(rows.nth(0).getByRole('cell', { name: 'Name' })).toBeInTheDocument();
	expect(rows.nth(0).getByRole('cell', { name: 'Role' })).toBeInTheDocument();

	expect(rows.nth(1).getByRole('cell', { name: 'Alice' })).toBeInTheDocument();
	expect(rows.nth(1).getByRole('cell', { name: 'Admin' })).toBeInTheDocument();
});
