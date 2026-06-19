import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderRichEditor } from './utils/renderRichEditor';
import { selectContent, selectPartialContent, setCursorPosition } from './utils/utils';

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

test('Pressing enter adds a new item to the list', async () => {
	const user = userEvent.setup();
	await renderRichEditor({ value: '- First item' });

	expect(screen.getAllByRole('listitem')).toHaveLength(1);

	// Set cursor and press Enter
	const firstItem = screen.getByRole('listitem');
	await user.click(firstItem);
	setCursorPosition(firstItem, 'First item'.length);
	await user.keyboard('{Enter}');

	const items = await screen.findAllByRole('listitem');
	expect(items).toHaveLength(2);
	expect(items[0]).toHaveTextContent('First item');
	expect(items[1]).toHaveTextContent('');
});

test('Pressing Enter on an empty last list item exits the list', async () => {
	const user = userEvent.setup();
	await renderRichEditor({ value: '- First item' });

	expect(screen.getAllByRole('listitem')).toHaveLength(1);
	expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();

	// Set cursor and press Enter
	const firstItem = screen.getByRole('listitem');
	await user.click(firstItem);
	setCursorPosition(firstItem, 'First item'.length);
	await user.keyboard('{Enter}');

	expect(screen.getAllByRole('listitem')).toHaveLength(2);
	expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();

	await user.keyboard('{Enter}');

	expect(screen.getAllByRole('listitem')).toHaveLength(1);

	// A new empty paragraph is created
	expect(screen.getByRole('paragraph')).toHaveTextContent('');
});

test('Toggles text formatting', async () => {
	const content = 'Hello, my dear friends!';
	const editor = await renderRichEditor({ value: content });

	const editorNode = screen.getByRole('textbox');
	selectContent(editorNode, content);

	// Apply strikethrough
	await editor.format('strikethrough');
	expect(screen.getByRole('deletion')).toHaveTextContent('Hello, my dear friends!');

	// Remove strikethrough
	await editor.format('strikethrough');
	expect(screen.queryByRole('deletion')).not.toBeInTheDocument();
	expect(screen.getByRole('textbox')).toHaveTextContent(content);

	// Apply italic
	await editor.format('italic');
	expect(screen.getByRole('emphasis')).toHaveTextContent('Hello, my dear friends!');

	// Remove italic
	await editor.format('italic');
	expect(screen.queryByRole('emphasis')).not.toBeInTheDocument();
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

	// Bold formatting is implemented using the <b> tag which has no ARIA role
	expect(screen.getByText(content).closest('b')).toBeInTheDocument();
	expect(screen.getByRole('emphasis')).toHaveTextContent('Hello, my dear friends!');
	expect(screen.getByRole('deletion')).toHaveTextContent('Hello, my dear friends!');

	// Removes bold without breaking others formatting
	await editor.format('bold');

	expect(screen.getByText(content).closest('b')).not.toBeInTheDocument();
	expect(screen.getByRole('emphasis')).toHaveTextContent('Hello, my dear friends!');
	expect(screen.getByRole('deletion')).toHaveTextContent('Hello, my dear friends!');
});

// TODO: Remove `.fails` after fixing the formatting implementation
// The assertions below describe the expected behavior and should remain unchanged
test.fails('Applies formatting to a selected part of a text node', async () => {
	const editor = await renderRichEditor({ value: 'Hello, my dear friends!' });

	const editorNode = screen.getByRole('paragraph');
	selectPartialContent(editorNode, 'friends');

	// Apply formatting
	await editor.format('italic');

	expect(editorNode).toHaveTextContent('Hello, my dear friends!');

	expect(screen.getByRole('emphasis')).toHaveTextContent(/^friends$/);
	expect(screen.getByRole('emphasis')).not.toHaveTextContent('Hello, my dear');
});

test.fails('Applies formatting across multiple text blocks', async () => {
	const editor = await renderRichEditor({
		value: 'Hello, my dear friends! \n\n Nice to see you. \n\n How are you ?',
	});

	const editorNode = screen.getByRole('textbox');
	selectContent(editorNode, 'Hello, my dear friends!', 'How are you ?');

	// Apply formatting
	await editor.format('italic');

	const formattingNodes = screen.getAllByRole('emphasis');

	expect(formattingNodes).toHaveLength(3);
	expect(formattingNodes[0]).toHaveTextContent('Hello, my dear friends!');
	expect(formattingNodes[1]).toHaveTextContent('Nice to see you');
	expect(formattingNodes[2]).toHaveTextContent('How are you ?');
});
