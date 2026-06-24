import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderRichEditor } from './utils/renderRichEditor';
import { selectContent, selectText, setCursorPosition } from './utils/utils';

test('Pressing Enter inside a paragraph splits it into two paragraphs', async () => {
	const user = userEvent.setup();
	await renderRichEditor({ value: 'My favorite dish is cake' });

	// Initial state
	expect(screen.getAllByRole('paragraph')).toHaveLength(1);
	const [paragraph] = screen.getAllByRole('paragraph');
	expect(paragraph).toHaveTextContent('My favorite dish is cake');

	// Place cursor and press Enter, (splits text to "My favorite dis" | "h is cake")
	await user.click(paragraph);
	setCursorPosition(paragraph, 'My favorite dis'.length);
	await user.keyboard('{Enter}');

	// Editor should now have two paragraphs split at the cursor
	const [firstParagraph, secondParagraph] = screen.getAllByRole('paragraph');
	expect(screen.getAllByRole('paragraph')).toHaveLength(2);
	expect(firstParagraph).toHaveTextContent('My favorite dis');
	expect(secondParagraph).toHaveTextContent('h is cake');
});

test('Ctrl+Enter exits a block node and creates a new empty paragraph', async () => {
	const user = userEvent.setup();
	const content = 'This is a blockquote';
	const richEditor = await renderRichEditor({ value: `> ${content}` });

	// One blockquote containing one paragraph
	expect(screen.getByRole('blockquote')).toHaveTextContent(content);
	expect(screen.getAllByRole('paragraph')).toHaveLength(1);

	// Press Ctrl+Enter to exit the blockquote
	await user.click(screen.getByRole('blockquote'));
	await user.keyboard('{Control>}{Enter}{/Control}');

	// New empty paragraph is added
	const paragraphs = screen.getAllByRole('paragraph');
	expect(paragraphs).toHaveLength(2);

	const [blockquoteParagraph, newParagraph] = paragraphs;
	expect(blockquoteParagraph).toHaveTextContent(content);
	expect(newParagraph).toHaveTextContent('');
	expect(newParagraph).toAppearAfter(screen.getByRole('blockquote'));

	expect(screen.getByRole('blockquote')).toHaveTextContent(content);

	// Cursor lands in the new paragraph - inserted content inside new paragraph
	await richEditor.insert({ type: 'date', data: { date: '01.01.2025' } });
	expect(screen.getByText('01.01.2025')).toBeInTheDocument();
	expect(screen.getByRole('blockquote')).not.toHaveTextContent('01.01.2025');
});

test(`Inserts image between text nodes`, async () => {
	const richEditor = await renderRichEditor({
		value: `My favorite image\n\n I love cat`,
	});

	setCursorPosition(screen.getByRole('textbox'), 'My favorite image'.length);

	// Simulate inserting an image via the editor panel action
	await richEditor.insert({
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
	const richEditor = await renderRichEditor({
		value: '```js\nconst a = 1;\n```',
	});

	// Place cursor position inside the code node
	setCursorPosition(screen.getByRole('code'), 10);

	await richEditor.insert({
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
	const richEditor = await renderRichEditor({ value: content });

	const editorNode = screen.getByRole('textbox');
	selectContent(editorNode, content);

	// Plain text becomes heading
	await richEditor.insert({ type: 'heading', data: { level: 1 } });
	expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(content);

	// Heading level is updated when different level applied
	await richEditor.insert({ type: 'heading', data: { level: 3 } });

	expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(content);
	expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();

	// Heading reverts to paragraph when same level applied again
	await richEditor.insert({ type: 'heading', data: { level: 3 } });

	expect(screen.queryByRole('heading')).not.toBeInTheDocument();
	expect(screen.getByText(content)).toBeInTheDocument();
});

test('Converts an unordered list to an ordered list', async () => {
	const richEditor = await renderRichEditor({
		value: `- First item
  - Nested item
- Second item`,
	});

	// Select text
	selectContent(screen.getByRole('textbox'), 'First item');

	// Update unordered list to ordered
	await richEditor.insert({ type: 'list', data: { type: 'ordered' } });

	const list = within(screen.getByRole('textbox')).getAllByRole('list')[0];
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

	selectContent(screen.getByRole('textbox'), content);

	// Apply strikethrough
	await richEditor.format('strikethrough');
	expect(screen.getByRole('deletion')).toHaveTextContent('Hello, my dear friends!');

	// Remove strikethrough
	await richEditor.format('strikethrough');
	expect(screen.queryByRole('deletion')).not.toBeInTheDocument();
	expect(screen.getByRole('textbox')).toHaveTextContent(content);

	// Apply italic
	await richEditor.format('italic');
	expect(screen.getByRole('emphasis')).toHaveTextContent('Hello, my dear friends!');

	// Remove italic
	await richEditor.format('italic');
	expect(screen.queryByRole('emphasis')).not.toBeInTheDocument();
	expect(screen.getByRole('textbox')).toHaveTextContent(content);
});

test('Combines multiple text formatting', async () => {
	const content = 'Hello, my dear friends!';
	const richEditor = await renderRichEditor({ value: content });

	selectContent(screen.getByRole('textbox'), content);

	await richEditor.format('italic');
	await richEditor.format('bold');
	await richEditor.format('strikethrough');

	// Bold formatting is implemented using the <b> tag which has no ARIA role
	expect(screen.getByText(content).closest('b')).toBeInTheDocument();
	expect(screen.getByRole('emphasis')).toHaveTextContent('Hello, my dear friends!');
	expect(screen.getByRole('deletion')).toHaveTextContent('Hello, my dear friends!');

	// Removes bold without breaking others formatting
	await richEditor.format('bold');

	expect(screen.getByText(content).closest('b')).not.toBeInTheDocument();
	expect(screen.getByRole('emphasis')).toHaveTextContent('Hello, my dear friends!');
	expect(screen.getByRole('deletion')).toHaveTextContent('Hello, my dear friends!');
});

// TODO: Remove `.fails` after fixing the formatting implementation
// The assertions below describe the expected behavior and should remain unchanged
test.fails('Applies formatting to a selected part of a text node', async () => {
	const richEditor = await renderRichEditor({ value: 'Hello, my dear friends!' });

	selectText(screen.getByRole('paragraph'), 'friends');

	// Apply formatting
	await richEditor.format('italic');

	expect(screen.getByRole('paragraph')).toHaveTextContent('Hello, my dear friends!');

	expect(screen.getByRole('emphasis')).toHaveTextContent(/^friends$/);
	expect(screen.getByRole('emphasis')).not.toHaveTextContent('Hello, my dear');
});

test.fails('Applies formatting across multiple text blocks', async () => {
	const richEditor = await renderRichEditor({
		value: 'Hello, my dear friends! \n\n Nice to see you. \n\n How are you ?',
	});

	selectContent(
		screen.getByRole('textbox'),
		'Hello, my dear friends!',
		'How are you ?',
	);

	// Apply formatting
	await richEditor.format('italic');

	const formattingNodes = screen.getAllByRole('emphasis');

	expect(formattingNodes).toHaveLength(3);
	expect(formattingNodes[0]).toHaveTextContent('Hello, my dear friends!');
	expect(formattingNodes[1]).toHaveTextContent('Nice to see you');
	expect(formattingNodes[2]).toHaveTextContent('How are you ?');
});
