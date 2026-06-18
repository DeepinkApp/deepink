import { readFileSync } from 'node:fs';
import path from 'node:path';

import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderRichEditor } from './utils/renderRichEditor';
import { selectContent, setCursorPosition } from './utils/utils';

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

test('Editing one editor does not affect the other editor', async () => {
	const editorA = await renderRichEditor({ value: `# Big text` });
	const editorB = await renderRichEditor({ value: `## Small text` });

	const [editorBoxA, editorBoxB] = screen.getAllByRole('textbox');
	expect(screen.getAllByRole('textbox')).toHaveLength(2);

	// initial state
	expect(within(editorBoxA).getByRole('heading', { level: 1 })).toHaveTextContent(
		'Big text',
	);
	expect(within(editorBoxB).getByRole('heading', { level: 2 })).toHaveTextContent(
		'Small text',
	);

	// change heading level in editorA, editorB must stay untouched
	selectContent(editorBoxA, 'Big text');
	await editorA.insert({ type: 'heading', data: { level: 4 } });

	expect(within(editorBoxA).getByRole('heading', { level: 4 })).toHaveTextContent(
		'Big text',
	);
	expect(within(editorBoxB).getByRole('heading', { level: 2 })).toHaveTextContent(
		'Small text',
	);
	expect(within(editorBoxA).queryByRole('heading', { level: 2 })).toBeNull();
	expect(within(editorBoxB).queryByRole('heading', { level: 4 })).toBeNull();

	// change heading level in editorB, editorA must stay untouched
	selectContent(editorBoxB, 'Small text');
	await editorB.insert({ type: 'heading', data: { level: 3 } });

	expect(within(editorBoxA).getByRole('heading', { level: 4 })).toHaveTextContent(
		'Big text',
	);
	expect(within(editorBoxB).getByRole('heading', { level: 3 })).toHaveTextContent(
		'Small text',
	);
	expect(within(editorBoxA).queryByRole('heading', { level: 3 })).toBeNull();
	expect(within(editorBoxB).queryByRole('heading', { level: 4 })).toBeNull();
});

test('ReadOnly editor is not editable while the other editor remains editable', async () => {
	const content = 'Same text';

	await renderRichEditor({ value: content, isReadOnly: true });
	const editorB = await renderRichEditor({ value: content });

	const [editorBoxA, editorBoxB] = screen.getAllByRole('textbox');
	expect(screen.getAllByRole('textbox')).toHaveLength(2);

	expect(editorBoxA).toHaveAttribute('contenteditable', 'false');
	expect(editorBoxB).toHaveAttribute('contenteditable', 'true');

	// editorB is editable — format must work
	selectContent(editorBoxB, content);
	await editorB.format('bold');
	expect(within(editorBoxB).getByText(content).closest('b')).toBeInTheDocument();

	// editorA must stay untouched
	expect(within(editorBoxA).getByText(content).closest('b')).not.toBeInTheDocument();
});

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

test('Editor is not editable in readonly mode', async () => {
	const user = userEvent.setup();
	await renderRichEditor({
		value: '# Hello',
		isReadOnly: true,
	});

	expect(screen.getByRole('textbox')).toHaveAttribute('contenteditable', 'false');

	// Cannot enter text
	await user.click(screen.getByRole('textbox'));
	await user.keyboard('Some text');

	expect(screen.queryByText('Some text')).not.toBeInTheDocument();
});

test(`Renders image from markdown syntax`, async () => {
	await renderRichEditor({
		value: `# Image ![My cat](http://example.com/cat.png) - my favorite image`,
	});

	const img = await screen.findByRole('img');

	expect(img).toBeInTheDocument();
	expect(img).toHaveAttribute('src', 'http://example.com/cat.png');
	expect(img).toHaveAttribute('alt', 'My cat');
});

test(`Inserts image between text nodes`, async () => {
	const editor = await renderRichEditor({
		value: `My favorite image\n\n I love cat`,
	});

	const editorNode = screen.getByRole('textbox');
	setCursorPosition(editorNode, 'My favorite image'.length);

	// Simulate inserting an image via the editor panel action
	await editor.insert({
		type: 'image',
		data: { url: 'http://example.com/cat.png', altText: 'My cat' },
	});

	// Image nodes inserting asynchronously, so use findByRole to wait for the img to appear
	const img = await screen.findByRole('img');

	expect(img).toBeInTheDocument();
	expect(img).toHaveAttribute('src', 'http://example.com/cat.png');
	expect(img).toHaveAttribute('alt', 'My cat');

	// Image between two texts
	const firstText = screen.getByText('My favorite image');
	const secondText = screen.getByText('I love cat');
	expect(img).toAppearAfter(firstText);
	expect(img).toAppearBefore(secondText);
});

test('Inserts image after block node', async () => {
	const editor = await renderRichEditor({
		value: '```js\nconst a = 1;\n```',
	});

	// Place cursor position inside the code node
	setCursorPosition(screen.getByRole('code'), 10);

	await editor.insert({
		type: 'image',
		data: { url: 'http://example.com/cat.png', altText: 'My cat' },
	});

	// Wait before image to appear
	const img = await screen.findByRole('img');
	const codeNode = screen.getByRole('code');
	expect(img).toBeInTheDocument();
	expect(codeNode).toBeInTheDocument();

	// Image is inserted as next sibling of the code block
	expect(img).toAppearAfter(codeNode);
	expect(codeNode.nextElementSibling).toContainElement(img);
});

test('Updates heading level correctly', async () => {
	const content = 'Hello, my dear friends!';
	const editor = await renderRichEditor({ value: content });

	const editorNode = screen.getByRole('textbox');
	selectContent(editorNode, content);

	// Plain text becomes heading
	await editor.insert({ type: 'heading', data: { level: 1 } });
	expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(content);

	// Heading level is updated when different level applied
	await editor.insert({ type: 'heading', data: { level: 3 } });

	expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(content);
	expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();

	// Heading reverts to paragraph when same level applied again
	await editor.insert({ type: 'heading', data: { level: 3 } });

	expect(screen.queryByRole('heading')).not.toBeInTheDocument();
	expect(screen.getByText(content)).toBeInTheDocument();
});

test('Toggles text formatting', async () => {
	const content = 'Hello, my dear friends!';
	const editor = await renderRichEditor({ value: content });

	const editorNode = screen.getByRole('textbox');
	selectContent(editorNode, content);

	// Apply bold
	await editor.format('bold');
	expect(screen.getByText(content).closest('b')).toBeInTheDocument();

	// Remove bold
	await editor.format('bold');
	expect(screen.getByText(content).closest('b')).not.toBeInTheDocument();
	expect(screen.getByRole('textbox')).toHaveTextContent(content);

	// Apply italic
	await editor.format('italic');
	expect(screen.getByText(content).closest('em')).toBeInTheDocument();

	// Remove italic
	await editor.format('italic');
	expect(screen.getByText(content).closest('em')).not.toBeInTheDocument();
	expect(screen.getByRole('textbox')).toHaveTextContent(content);
});

test('Combines multiple text formatting', async () => {
	const content = 'Hello, my dear friends!';
	const editor = await renderRichEditor({ value: content });

	const editorNode = screen.getByRole('textbox');
	selectContent(editorNode, content);

	await editor.format('italic');
	await editor.format('bold');
	await editor.format('strikethrough');

	const formattedText = screen.getByText(content);
	expect(formattedText.closest('b')).toBeInTheDocument();
	expect(formattedText.closest('em')).toBeInTheDocument();
	expect(formattedText.closest('del')).toBeInTheDocument();

	// Removes bold without breaking others formatting
	await editor.format('bold');

	const updatedText = screen.getByText(content);
	expect(updatedText.closest('b')).not.toBeInTheDocument();
	expect(updatedText.closest('em')).toBeInTheDocument();
	expect(updatedText.closest('del')).toBeInTheDocument();
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

test('Converts an unordered list to an ordered list', async () => {
	const editor = await renderRichEditor({
		value: `- First item
  - Nested item
- Second item`,
	});

	// Select text
	const editorNode = screen.getByRole('textbox');
	selectContent(editorNode, 'First item');

	// Update unordered list to ordered
	await editor.insert({ type: 'list', data: { type: 'ordered' } });

	const list = within(screen.getByRole('textbox')).getAllByRole('list')[0];
	expect(list.tagName).toBe('OL');

	const orderedList = within(screen.getByRole('textbox')).getAllByRole('listitem');
	expect(orderedList).toHaveLength(3);

	expect(orderedList[0]).toHaveTextContent('First item');

	// Second item is nested inside first item
	expect(within(orderedList[0]).getByText('Nested item')).toBeInTheDocument();

	expect(orderedList[2]).toHaveTextContent('Second item');
});
