import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderRichEditor } from './utils/renderRichEditor';
import { selectContent, selectText, setCursorPosition } from './utils/utils';

test('Pressing Enter inside a paragraph splits it into two paragraphs', async () => {
	const user = userEvent.setup();
	await renderRichEditor({ value: 'My favorite dish is cake' });
	const editor = screen.getByRole('textbox');

	// Initial state
	expect(within(editor).getAllByRole('paragraph')).toHaveLength(1);
	const [paragraph] = within(editor).getAllByRole('paragraph');
	expect(paragraph).toHaveTextContent('My favorite dish is cake');

	// Place cursor and press Enter
	await user.click(paragraph);
	setCursorPosition(paragraph, 'My favorite dis'.length);
	await user.keyboard('{Enter}');

	// Editor should now have two paragraphs split at the cursor
	const [firstParagraph, secondParagraph] = within(editor).getAllByRole('paragraph');
	expect(within(editor).getAllByRole('paragraph')).toHaveLength(2);
	expect(firstParagraph).toHaveTextContent('My favorite dis');
	expect(secondParagraph).toHaveTextContent('h is cake');
});

test('Ctrl+Enter exits a block node and creates a new empty paragraph', async () => {
	const user = userEvent.setup();
	const content = 'This is a blockquote';
	const richEditor = await renderRichEditor({ value: `> ${content}` });
	const editor = screen.getByRole('textbox');

	// One blockquote containing one paragraph
	expect(within(editor).getByRole('blockquote')).toHaveTextContent(content);
	expect(within(editor).getAllByRole('paragraph')).toHaveLength(1);

	// Press Ctrl+Enter to exit the blockquote
	await user.click(within(editor).getByRole('blockquote'));
	await user.keyboard('{Control>}{Enter}{/Control}');

	// New empty paragraph is added
	const paragraphs = within(editor).getAllByRole('paragraph');
	expect(paragraphs).toHaveLength(2);

	const [blockquoteParagraph, newParagraph] = paragraphs;
	expect(blockquoteParagraph).toHaveTextContent(content);
	expect(newParagraph).toHaveTextContent('');
	expect(newParagraph).toAppearAfter(within(editor).getByRole('blockquote'));

	expect(within(editor).getByRole('blockquote')).toHaveTextContent(content);

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
});

test('Converts an unordered list to an ordered list', async () => {
	const richEditor = await renderRichEditor({
		value: `- First item
  - Nested item
- Second item`,
	});

	// Select text
	const editor = screen.getByRole('textbox');
	selectContent(editor, 'First item');

	// Update unordered list to ordered
	await richEditor.insert({ type: 'list', data: { type: 'ordered' } });

	const list = within(editor).getAllByRole('list')[0];
	expect(list.tagName).toBe('OL');

	const orderedList = within(list).getAllByRole('listitem');
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
	const richEditor = await renderRichEditor({ value: content });

	const editor = screen.getByRole('textbox');
	selectContent(editor, content);

	// Apply strikethrough
	await richEditor.format('strikethrough');
	expect(within(editor).getByRole('deletion')).toHaveTextContent(content);

	// Remove strikethrough
	await richEditor.format('strikethrough');
	expect(within(editor).queryByRole('deletion')).not.toBeInTheDocument();
	expect(editor).toHaveTextContent(content);

	// Apply italic
	await richEditor.format('italic');
	expect(within(editor).getByRole('emphasis')).toHaveTextContent(content);

	// Remove italic
	await richEditor.format('italic');
	expect(within(editor).queryByRole('emphasis')).not.toBeInTheDocument();
	expect(editor).toHaveTextContent(content);
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

	expect(within(editor).getByRole('paragraph')).toHaveTextContent(
		'Hello, my dear friends!',
	);

	expect(within(editor).getByRole('emphasis')).toHaveTextContent(/^friends$/);
	expect(within(editor).getByRole('emphasis')).not.toHaveTextContent('Hello, my dear');
});

test.fails('Applies formatting across multiple text blocks', async () => {
	const richEditor = await renderRichEditor({
		value: 'Hello, my dear friends! \n\n Nice to see you. \n\n How are you ?',
	});

	const editor = screen.getByRole('textbox');
	selectContent(editor, 'Hello, my dear friends!', 'How are you ?');

	// Apply formatting
	await richEditor.format('italic');

	const formattingNodes = within(editor).getAllByRole('emphasis');

	expect(formattingNodes).toHaveLength(3);
	expect(formattingNodes[0]).toHaveTextContent('Hello, my dear friends!');
	expect(formattingNodes[1]).toHaveTextContent('Nice to see you');
	expect(formattingNodes[2]).toHaveTextContent('How are you ?');
});
