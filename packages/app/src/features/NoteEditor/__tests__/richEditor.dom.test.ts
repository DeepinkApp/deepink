import { screen, within } from '@testing-library/react';

import { renderRichEditor } from './utils/renderRichEditor';
import { selectContent, setCursorPosition } from './utils/utils';

test('Renders simple markdown correctly', async () => {
	await renderRichEditor({
		value: `# Title
Paragraph
> Quote
---
- List item
- Next item

\`\`\`js
console.log('Hello');
\`\`\`

[link](http://example.com)`,
	});

	expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Title');
	expect(screen.getByText('Paragraph').closest('p')).toBeInTheDocument();
	expect(screen.getByRole('blockquote')).toHaveTextContent('Quote');

	// horizontal rule
	expect(screen.getByRole('separator')).toBeInTheDocument();

	// List render correctly
	expect(screen.getByRole('list')).toBeInTheDocument();

	const items = within(screen.getByRole('list')).getAllByRole('listitem');
	expect(items).toHaveLength(2);
	expect(items[0]).toHaveTextContent('List item');
	expect(items[1]).toHaveTextContent('Next item');

	expect(screen.getByRole('code')).toBeInTheDocument();
	expect(screen.getByRole('link')).toHaveAttribute('href', 'http://example.com');
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
	await renderRichEditor({
		value: '# Hello',
		isReadOnly: true,
	});

	expect(screen.getByRole('textbox')).toHaveAttribute('contenteditable', 'false');
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

	const container = screen.getByRole('textbox');
	expect(editor).not.toBeUndefined();
	selectContent(container, 'My favorite image');

	// Simulate inserting an image via the editor panel action
	await editor.insert({
		type: 'image',
		data: { url: 'http://example.com/cat.png', altText: 'My cat' },
	});

	// Image nodes inserting asynchronously, so use findByRole to wait for the img to appear
	const img = await screen.findByRole('img');
	const firstText = screen.getByText('My favorite image');
	const secondText = screen.getByText('I love cat');

	expect(img).toBeInTheDocument();
	expect(img).toHaveAttribute('src', 'http://example.com/cat.png');
	expect(img).toHaveAttribute('alt', 'My cat');

	// Image between two texts
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

	const container = screen.getByRole('textbox');
	expect(editor).not.toBeUndefined();
	selectContent(container, content);

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

	const container = screen.getByRole('textbox');
	expect(editor).not.toBeUndefined();
	selectContent(container, content);

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

	const container = screen.getByRole('textbox');
	expect(editor).not.toBeUndefined();
	selectContent(container, content);

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
	const container = screen.getByRole('textbox');
	expect(editor).not.toBeUndefined();
	selectContent(container, 'First item');

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
