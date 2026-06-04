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

	selectContent('My favorite image');

	await editor.insert({
		type: 'image',
		data: { url: 'http://example.com/cat.png', altText: 'My cat' },
	});

	const firstText = screen.getByText('My favorite image');
	const secondText = screen.getByText('I love cat');
	const img = screen.getByRole('img');

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

	// Place cursor position inside code node
	const code = screen.getByText('const a = 1;');
	const textNode = code.firstChild;
	expect(textNode).toBeInstanceOf(Text);
	setCursorPosition(textNode as Text);

	await editor.insert({
		type: 'image',
		data: { url: 'http://example.com/cat.png', altText: 'My cat' },
	});

	const img = screen.getByRole('img');
	const codeNode = screen.getByRole('code');
	expect(img).toBeInTheDocument();

	// Image is inserted as next sibling of the code block
	expect(img).toAppearAfter(codeNode);
	expect(codeNode.nextElementSibling).toContainElement(img);
});

test('Updates heading level correctly', async () => {
	const content = 'Hello, my dear friends!';
	const editor = await renderRichEditor({ value: content });

	selectContent(content);

	// Plain text becomes heading
	await editor.insert({ type: 'heading', data: { level: 1 } });
	expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(content);

	// Heading level is updated when different level applied
	await editor.insert({ type: 'heading', data: { level: 3 } });
	expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(content);
	expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();

	// Heading reverts to paragraph when same level applied again
	await editor.insert({ type: 'heading', data: { level: 1 } });
	expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
	expect(screen.getByText(content)).toBeInTheDocument();
});

test('Toggles text formatting', async () => {
	const content = 'Hello, my dear friends!';
	const editor = await renderRichEditor({ value: content });

	selectContent(content);

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

	selectContent(content);
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

	const ul = within(screen.getByRole('textbox')).getAllByRole('list')[0];

	const checkboxList = within(ul).getAllByRole('checkbox');
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
	selectContent('First item');

	// Update unordered list to ordered
	await editor.insert({ type: 'list', data: { type: 'ordered' } });

	const rootList = within(screen.getByRole('textbox')).getAllByRole('list')[0];
	expect(rootList.tagName).toBe('OL');

	const orderedListItems = within(rootList).getAllByRole('listitem');
	expect(orderedListItems).toHaveLength(3);

	expect(orderedListItems[0]).toHaveTextContent('First item');

	// Second item is nested inside first item
	expect(within(orderedListItems[0]).getByText('Nested item')).toBeInTheDocument();

	expect(orderedListItems[2]).toHaveTextContent('Second item');
});
