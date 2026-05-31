import { act, screen, within } from '@testing-library/react';

import { renderRichEditor } from './utils/renderRichEditor';
import { setCursorPosition, setTextSelection } from './utils/utils';

test('renders simple markdown correctly', async () => {
	await renderRichEditor({
		value: `# Title
Paragraph
> Quote

- List item
- Next item

\`\`\`js
console.log('Hello');
\`\`\`

[link](http://example.com)`,
	});

	expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Title');
	expect((await screen.findByText('Paragraph')).closest('p')).toBeInTheDocument();
	expect(await screen.findByRole('blockquote')).toHaveTextContent('Quote');

	// List render correctly
	const ul = screen.getByRole('list');
	expect(ul).toBeInTheDocument();

	const items = within(ul).getAllByRole('listitem');
	expect(items).toHaveLength(2);
	expect(items[0]).toHaveTextContent('List item');
	expect(items[1]).toHaveTextContent('Next item');

	expect(await screen.findByRole('code')).toBeInTheDocument();
	expect(await screen.findByRole('link')).toHaveAttribute('href', 'http://example.com');
});

test('Editor updates when value changes', async () => {
	const { rerender } = await renderRichEditor({
		value: `# Big text`,
	});

	expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
		'Big text',
	);

	// Run component rerender with new value
	await rerender({ value: `### Not so big text` });

	expect(await screen.findByRole('heading', { level: 3 })).toHaveTextContent(
		'Not so big text',
	);

	// The old header was removed
	expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
});

test('Editor is not editable in readonly mode', async () => {
	await renderRichEditor({ value: '# Hello', isReadOnly: true });
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
	const { insert } = await renderRichEditor({
		value: `My favorite image\n\n I love cat`,
	});

	// Place cursor after the first text node
	const text = await screen.findByText('My favorite image');
	const textElement = text.firstChild;
	expect(textElement).toBeInstanceOf(Text);
	setTextSelection(textElement as Text, 0, 'My favorite image'.length);

	await act(async () => {
		insert({
			type: 'image',
			data: { url: 'http://example.com/cat.png', altText: 'My cat' },
		});
	});

	const firstText = await screen.findByText('My favorite image');
	const secondText = await screen.findByText('I love cat');
	const img = await screen.findByRole('img');

	expect(img).toBeInTheDocument();
	expect(img).toHaveAttribute('src', 'http://example.com/cat.png');
	expect(img).toHaveAttribute('alt', 'My cat');

	// Image between two texts
	expect(img).toAppearAfter(firstText);
	expect(img).toAppearBefore(secondText);
});

test('Inserts image after block node', async () => {
	const { insert } = await renderRichEditor({
		value: '```js\nconst a = 1;\n```',
	});

	// Place cursor position inside code node
	const codeText = await screen.findByText('const a = 1;');
	const textNode = codeText.firstChild;
	expect(textNode).toBeInstanceOf(Text);

	setCursorPosition(textNode as Text);

	await act(async () => {
		insert({
			type: 'image',
			data: { url: 'http://example.com/cat.png', altText: 'My cat' },
		});
	});

	const img = await screen.findByRole('img');
	const codeNode = await screen.findByRole('code');
	expect(img).toBeInTheDocument();

	// Image is inserted as next sibling of the code block
	expect(img).toAppearAfter(codeNode);
	expect(codeNode.nextElementSibling).toContainElement(img);
});

test('Updates heading level correctly', async () => {
	const content = 'Hello, my dear friends!';
	const { insert: insertHeading } = await renderRichEditor({ value: content });

	const text = await screen.findByText(content);
	const textElement = text.firstChild;
	expect(textElement).toBeInstanceOf(Text);
	setTextSelection(textElement as Text, 0, content.length);

	// Plain text becomes heading
	act(() => insertHeading({ type: 'heading', data: { level: 1 } }));
	expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(content);

	// Heading level is updated when different level applied
	act(() => insertHeading({ type: 'heading', data: { level: 3 } }));
	expect(await screen.findByRole('heading', { level: 3 })).toHaveTextContent(content);
	expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();

	// Heading reverts to paragraph when same level applied again
	await act(async () => insertHeading({ type: 'heading', data: { level: 1 } }));

	expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
	expect(screen.getByText(content)).toBeInTheDocument();
});

test('Toggles text formatting', async () => {
	const content = 'Hello, my dear friends!';
	const { format } = await renderRichEditor({ value: content });

	const text = await screen.findByText(content);
	const textElement = text.firstChild;
	expect(textElement).toBeInstanceOf(Text);
	setTextSelection(textElement as Text, 0, content.length);

	// Apply bold
	await act(async () => format('bold'));
	expect(screen.getByText(content).closest('b')).toBeInTheDocument();

	// Remove bold
	await act(async () => format('bold'));
	expect(screen.getByText(content).closest('b')).not.toBeInTheDocument();
	expect(screen.getByRole('textbox')).toHaveTextContent(content);

	// Apply italic
	await act(async () => format('italic'));
	expect(screen.getByText(content).closest('em')).toBeInTheDocument();

	// Remove italic
	await act(async () => format('italic'));
	expect(screen.getByText(content).closest('em')).not.toBeInTheDocument();
	expect(screen.getByRole('textbox')).toHaveTextContent(content);
});

test('Combines multiple text formatting', async () => {
	const content = 'Hello, my dear friends!';
	const { format } = await renderRichEditor({ value: content });

	const text = await screen.findByText(content);
	const textElement = text.firstChild;
	expect(textElement).toBeInstanceOf(Text);
	setTextSelection(textElement as Text, 0, content.length);

	await act(async () => format('italic'));
	await act(async () => format('bold'));
	await act(async () => format('strikethrough'));

	const formattedText = screen.getByText(content);
	expect(formattedText.closest('b')).toBeInTheDocument();
	expect(formattedText.closest('em')).toBeInTheDocument();
	expect(formattedText.closest('del')).toBeInTheDocument();

	// Removes bold without breaking others formatting
	await act(async () => format('bold'));

	const updatedText = screen.getByText(content);
	expect(updatedText.closest('b')).not.toBeInTheDocument();
	expect(updatedText.closest('em')).toBeInTheDocument();
	expect(updatedText.closest('del')).toBeInTheDocument();
});

test('Checked list render correctly', async () => {
	await renderRichEditor({
		value: `- [x] First item
  - [ ] Nested item
- [ ] Second item`,
	});

	const editor = await screen.findByRole('textbox');

	const ul = within(editor).getAllByRole('list')[0];
	expect(ul).toBeInTheDocument();

	const checkboxes = within(ul).getAllByRole('checkbox');
	const firstItem = checkboxes[0];
	expect(firstItem).toHaveTextContent('First item');
	expect(firstItem).toBeChecked();

	const secondItem = checkboxes[1];
	expect(secondItem).toHaveTextContent('Nested item');
	expect(secondItem).not.toBeChecked();

	const thirdItem = checkboxes[2];
	expect(thirdItem).toHaveTextContent('Second item');
	expect(thirdItem).not.toBeChecked();
});
