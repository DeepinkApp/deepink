import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderRichEditor } from './utils/renderRichEditor';
import { selectContent, selectText, setCursorPosition } from './utils/utils';

test('Pressing Enter inside a paragraph splits it into two paragraphs', async () => {
	const user = userEvent.setup();
	await renderRichEditor({ value: 'My favorite dish is cake' });

	// Initial state
	const editor = screen.getByRole('textbox');
	expect(editor.children).toHaveLength(1);
	const paragraph = editor.children[0];
	expect(paragraph).toHaveRole('paragraph');
	expect(paragraph).toHaveTextContent('My favorite dish is cake');

	// Place cursor and press Enter
	await user.click(paragraph);
	setCursorPosition(paragraph, 'My favorite dis'.length);
	await user.keyboard('{Enter}');

	// Editor should now have two paragraphs split at the cursor
	const editorChildren = editor.children;
	expect(editorChildren).toHaveLength(2);

	expect(editorChildren[0]).toHaveRole('paragraph');
	expect(editorChildren[0]).toHaveTextContent('My favorite dis');

	expect(editorChildren[1]).toHaveRole('paragraph');
	expect(editorChildren[1]).toHaveTextContent('h is cake');
});

test('Ctrl+Enter exits a block node and creates a new empty paragraph', async () => {
	const user = userEvent.setup();
	const content = 'This is a blockquote';
	const richEditor = await renderRichEditor({ value: `> ${content}` });

	// One blockquote with one paragraph inside
	const editor = screen.getByRole('textbox');
	const initialChildren = editor.children;
	expect(initialChildren).toHaveLength(1);
	expect(initialChildren[0]).toHaveRole('blockquote');
	expect(initialChildren[0]).toHaveTextContent(content);

	expect(within(editor).getAllByRole('paragraph')).toHaveLength(1);

	// Press Ctrl+Enter to exit the blockquote
	await user.click(within(editor).getByRole('blockquote'));
	await user.keyboard('{Control>}{Enter}{/Control}');

	// New empty paragraph is added
	const editorChildren = editor.children;
	expect(editorChildren).toHaveLength(2);
	expect(editorChildren[0]).toHaveRole('blockquote');
	expect(editorChildren[1]).toHaveRole('paragraph');

	const paragraphs = within(editor).getAllByRole('paragraph');
	expect(paragraphs).toHaveLength(2);
	expect(paragraphs[0]).toHaveTextContent(content);
	expect(paragraphs[1]).toHaveTextContent('');

	// Cursor lands in the new paragraph - inserted content inside new paragraph
	await richEditor.insert({ type: 'date', data: { date: '01.01.2025' } });
	expect(within(editor).getByText('01.01.2025')).toBeInTheDocument();
	expect(within(editor).getByRole('blockquote')).not.toHaveTextContent('01.01.2025');
});

test(`Inserts image between text nodes`, async () => {
	const richEditor = await renderRichEditor({
		value: `My favorite image\n\n I love cat`,
	});

	const editor = screen.getByRole('textbox');
	setCursorPosition(editor, 'My favorite image'.length);

	// Simulate inserting an image via the editor panel action
	await richEditor.insert({
		type: 'image',
		data: { url: 'http://example.com/cat.png', altText: 'My cat' },
	});

	// Image nodes inserting asynchronously, so use findByRole to wait for the img to appear
	const img = await within(editor).findByRole('img');
	expect(img).toBeInTheDocument();
	expect(img).toHaveAttribute('src', 'http://example.com/cat.png');
	expect(img).toHaveAttribute('alt', 'My cat');

	// Image between two texts
	const firstText = within(editor).getByText('My favorite image');
	const secondText = within(editor).getByText('I love cat');
	expect(img).toAppearAfter(firstText);
	expect(img).toAppearBefore(secondText);

	// Editor contains only expected nodes
	const editorChildren = editor.children;
	expect(editorChildren).toHaveLength(3);
	Array.from(editor.children).forEach((child) => {
		expect(child).toHaveRole('paragraph');
	});

	// First paragraph contains text and image
	expect(editorChildren[0]).toContainElement(img);
	expect(editorChildren[0]).toHaveTextContent('My favorite image');
	expect(editorChildren[1]).toHaveTextContent('');
	expect(editorChildren[2]).toHaveTextContent('I love cat');
});

test('Inserts image after block node', async () => {
	const richEditor = await renderRichEditor({
		value: '```js\nconst a = 1;\n```',
	});

	// Place cursor position inside the code node
	const editor = screen.getByRole('textbox');
	setCursorPosition(within(editor).getByRole('code'), 10);

	await richEditor.insert({
		type: 'image',
		data: { url: 'http://example.com/cat.png', altText: 'My cat' },
	});

	// Wait before image to appear
	const img = await within(editor).findByRole('img');
	expect(img).toBeInTheDocument();

	const codeNode = within(editor).getByRole('code');
	expect(codeNode).toBeInTheDocument();

	// Image is inserted as next sibling of the code block
	expect(img).toAppearAfter(codeNode);
	expect(codeNode.nextElementSibling).toContainElement(img);

	const editorChildren = editor.children;
	expect(editorChildren).toHaveLength(2);
	expect(editorChildren[0]).toHaveRole('code');
	expect(editorChildren[1]).toHaveRole('paragraph');

	// Image is inside the paragraph
	expect(editorChildren[1]).toContainElement(img);
});

test('Updates heading level correctly', async () => {
	const content = 'Hello, my dear friends!';
	const richEditor = await renderRichEditor({ value: content });

	const editor = screen.getByRole('textbox');
	selectContent(editor, content);

	// Plain text becomes heading
	await richEditor.insert({ type: 'heading', data: { level: 1 } });
	expect(within(editor).getByRole('heading', { level: 1 })).toHaveTextContent(content);

	// Heading level is updated when different level applied
	await richEditor.insert({ type: 'heading', data: { level: 3 } });

	expect(within(editor).getByRole('heading', { level: 3 })).toHaveTextContent(content);
	expect(within(editor).queryByRole('heading', { level: 1 })).not.toBeInTheDocument();

	// Heading reverts to paragraph when same level applied again
	await richEditor.insert({ type: 'heading', data: { level: 3 } });

	expect(within(editor).queryByRole('heading')).not.toBeInTheDocument();
	expect(within(editor).getByText(content)).toBeInTheDocument();

	// After editing the screen should contain one paragraph with a text
	const editorChildren = editor.children;
	expect(editorChildren).toHaveLength(1);
	expect(editorChildren[0]).toHaveRole('paragraph');
	expect(editorChildren[0]).toHaveTextContent(content);
});

test('Converts an unordered list to an ordered list', async () => {
	const richEditor = await renderRichEditor({
		value: `- First item
  - Nested item
- Second item`,
	});
	const editor = screen.getByRole('textbox');

	expect(editor.children[0].tagName).toBe('UL');
	expect(editor.children[0].children).toHaveLength(2);

	// Select text and convert to ordered list
	selectContent(editor, 'First item');
	await richEditor.insert({ type: 'list', data: { type: 'ordered' } });

	expect(editor.children[0].tagName).toBe('OL');

	const listItems = editor.children[0].children;
	expect(listItems).toHaveLength(2);

	// First item has text and nested list
	const firstItemChildren = listItems[0].children;
	expect(firstItemChildren).toHaveLength(2);
	expect(listItems[0]).toHaveTextContent('First item');

	const nestedListChildren = firstItemChildren[1].children;
	expect(nestedListChildren).toHaveLength(1);
	expect(nestedListChildren[0]).toHaveTextContent('Nested item');

	expect(listItems[1].children).toHaveLength(1);
	expect(listItems[1]).toHaveTextContent('Second item');
});

test('Pressing Enter adds a new item to the list', async () => {
	const user = userEvent.setup();
	await renderRichEditor({ value: '- First item' });
	const editor = screen.getByRole('textbox');

	const initialChildren = editor.children;
	expect(initialChildren).toHaveLength(1);
	expect(initialChildren[0]).toHaveRole('list');
	expect(initialChildren[0].children).toHaveLength(1);

	const [firstItem] = within(editor).getAllByRole('listitem');
	expect(firstItem).toHaveTextContent('First item');

	// Place cursor and press Enter
	await user.click(firstItem);
	setCursorPosition(firstItem, 'First item'.length);
	await user.keyboard('{Enter}');

	// Editor contains only one list with two items
	const editorChildren = editor.children;
	expect(editorChildren).toHaveLength(1);
	expect(editorChildren[0]).toHaveRole('list');

	const items = editorChildren[0].children;
	expect(items).toHaveLength(2);
	expect(items[0]).toHaveTextContent('First item');
	expect(items[1]).toHaveTextContent('');
});

test('Pressing Enter on an empty last list item exits the list', async () => {
	const user = userEvent.setup();
	await renderRichEditor({ value: '- First item' });
	const editor = screen.getByRole('textbox');

	const initialChildren = editor.children;
	expect(initialChildren).toHaveLength(1);
	expect(initialChildren[0]).toHaveRole('list');
	expect(initialChildren[0].children).toHaveLength(1);

	expect(within(editor).getAllByRole('listitem')).toHaveLength(1);
	expect(within(editor).queryByRole('paragraph')).not.toBeInTheDocument();

	// Set cursor and press Enter
	const firstItem = within(editor).getByRole('listitem');
	await user.click(firstItem);
	setCursorPosition(firstItem, 'First item'.length);
	await user.keyboard('{Enter}');

	expect(within(editor).getAllByRole('listitem')).toHaveLength(2);
	expect(within(editor).queryByRole('paragraph')).not.toBeInTheDocument();

	await user.keyboard('{Enter}');

	// A new empty paragraph is created
	expect(within(editor).getByRole('paragraph')).toHaveTextContent('');
	expect(within(editor).getAllByRole('listitem')).toHaveLength(1);

	// Editor contains only list with one items and one paragraph
	const editorChildren = editor.children;
	expect(editorChildren).toHaveLength(2);
	expect(editorChildren[0]).toHaveRole('list');
	expect(editorChildren[0].children).toHaveLength(1);
	expect(editorChildren[1]).toHaveRole('paragraph');
});

test('Toggles text formatting', async () => {
	const content = 'Hello, my dear friends!';
	const richEditor = await renderRichEditor({ value: content });

	const editor = screen.getByRole('textbox');
	selectContent(editor, content);

	// Apply strikethrough
	await richEditor.format('strikethrough');
	expect(within(editor).getByRole('deletion')).toHaveTextContent(content);

	// Remove strikethrough
	await richEditor.format('strikethrough');
	expect(editor.children).toHaveLength(1);
	expect(editor.children[0]).toHaveTextContent(content);
	expect(within(editor).queryByRole('deletion')).not.toBeInTheDocument();

	// Apply italic
	await richEditor.format('italic');
	expect(within(editor).getByRole('emphasis')).toHaveTextContent(content);

	// Remove italic
	await richEditor.format('italic');
	expect(editor.children).toHaveLength(1);
	expect(editor.children[0]).toHaveTextContent(content);
	expect(within(editor).queryByRole('emphasis')).not.toBeInTheDocument();
});

test('Combines multiple text formatting', async () => {
	const content = 'Hello, my dear friends!';
	const richEditor = await renderRichEditor({ value: content });

	const editor = screen.getByRole('textbox');
	selectContent(editor, content);

	await richEditor.format('italic');
	await richEditor.format('bold');
	await richEditor.format('strikethrough');

	// Bold formatting is implemented using the <b> tag which has no ARIA role
	expect(within(editor).getByText(content).closest('b')).toBeInTheDocument();
	expect(within(editor).getByRole('emphasis')).toHaveTextContent(content);
	expect(within(editor).getByRole('deletion')).toHaveTextContent(content);

	// Removes bold without breaking others formatting
	await richEditor.format('bold');

	expect(within(editor).getByText(content).closest('b')).not.toBeInTheDocument();
	expect(within(editor).getByRole('emphasis')).toHaveTextContent(content);
	expect(within(editor).getByRole('deletion')).toHaveTextContent(content);
});

// TODO: Remove `.fails` after fixing the formatting implementation
// The assertions below describe the expected behavior and should remain unchanged
test.fails('Applies formatting to a selected part of a text node', async () => {
	const richEditor = await renderRichEditor({ value: 'Hello, my dear friends!' });

	const editor = screen.getByRole('textbox');
	selectText(editor, 'friends');

	// Apply formatting
	await richEditor.format('italic');

	// Editor contains one paragraph
	const editorChildren = editor.children;
	expect(editorChildren).toHaveLength(1);
	expect(editorChildren[0]).toHaveRole('paragraph');

	const paragraph = editorChildren[0];
	expect(paragraph).toHaveTextContent('Hello, my dear friends!');
	expect(paragraph.children).toHaveLength(3);

	// Only "friends" is wrapped in emphasis
	expect(paragraph.children[0]).toHaveTextContent('Hello, my dear ');
	expect(paragraph.children[1]).toHaveRole('emphasis');
	expect(paragraph.children[1]).toHaveTextContent('friends');
	expect(paragraph.children[2]).toHaveTextContent('!');
});

test.fails('Applies formatting across multiple text blocks', async () => {
	const richEditor = await renderRichEditor({
		value: 'Hello, my dear friends! \n\n Nice to see you. \n\n How are you ?',
	});

	const editor = screen.getByRole('textbox');
	selectContent(editor, 'Hello, my dear friends!', 'How are you ?');

	// Apply formatting
	await richEditor.format('italic');

	// Each line should be wrapped in emphasis
	const formattingNodes = within(editor).getAllByRole('emphasis');
	expect(formattingNodes).toHaveLength(3);
	expect(formattingNodes[0]).toHaveTextContent('Hello, my dear friends!');
	expect(formattingNodes[1]).toHaveTextContent('Nice to see you');
	expect(formattingNodes[2]).toHaveTextContent('How are you ?');
});
