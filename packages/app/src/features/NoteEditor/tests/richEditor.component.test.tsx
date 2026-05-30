import { readFileSync } from 'fs';
import path from 'path';
import { act, screen } from '@testing-library/react';

import { renderRichEditor } from './utils/renderRichEditor';
import { selectText } from './utils/selectText';

beforeEach(() => {
	// jsdom does not perform real image loading, so Image.onload is never triggered
	// This can block components that rely on image load (like Image Node) to render or update DOM, so we mock it
	class MockImage {
		onload = () => {};

		set src(_: string) {
			queueMicrotask(() => this.onload());
		}
	}
	global.Image = MockImage as any;

	// jsdom does not implement layout APIs - getClientRects() returns an object without item(),
	// which causes HighlightingPlugin to crash. Mock it to return a valid empty DOMRectList
	Element.prototype.getClientRects = () =>
		({
			item: () => null,
			length: 0,
			[Symbol.iterator]: () => {},
		}) as unknown as DOMRectList;
});

const basicMarkdown = readFileSync(
	path.resolve(path.dirname(__filename), './resources/basicMarkdown.txt'),
).toString('utf8');

test('Correct handle base md', async () => {
	await renderRichEditor({ value: basicMarkdown });

	expect((await screen.findByRole('textbox')).innerHTML).toMatchSnapshot();
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

test(`Correct for image md`, async () => {
	await renderRichEditor({
		value: `# Image ![My cat](http://example.com/cat.png) - my favorite image`,
	});

	const img = await screen.findByRole('img');

	expect(img).toBeInTheDocument();
	expect(img).toHaveAttribute('src', 'http://example.com/cat.png');
	expect(img).toHaveAttribute('alt', 'My cat');
});

test('Updates heading level correctly', async () => {
	const content = 'Hello, my dear friends!';
	const { insert: insertHeading } = await renderRichEditor({ value: content });

	const textElement = await screen.findByText('Hello, my dear friends!');
	const textNode = textElement.firstChild;
	expect(textNode).toBeInstanceOf(Text);
	selectText(textNode as Text, 0, content.length);

	// Plain text becomes heading
	act(() => insertHeading({ type: 'heading', data: { level: 1 } }));
	expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
		'Hello, my dear friends!',
	);

	// Heading level is updated when different level applied
	act(() => insertHeading({ type: 'heading', data: { level: 3 } }));
	expect(await screen.findByRole('heading', { level: 3 })).toHaveTextContent(
		'Hello, my dear friends!',
	);
	expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();

	// Heading reverts to paragraph when same level applied again
	await act(async () => insertHeading({ type: 'heading', data: { level: 1 } }));

	expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
	expect(screen.getByText('Hello, my dear friends!')).toBeInTheDocument();
});

test('Applies and removes text formatting', async () => {
	const content = 'Hello, my dear friends!';
	const { format } = await renderRichEditor({ value: content });

	// Select text
	const text = await screen.findByText('Hello, my dear friends!');
	const textElement = text.firstChild;
	expect(textElement).toBeInstanceOf(Text);
	selectText(textElement as Text, 0, content.length);

	// Apply and remove bold
	const textbox = screen.getByRole('textbox');
	await act(async () => format('bold'));
	expect(textbox.querySelector('b')).toHaveTextContent('Hello, my dear friends!');

	await act(async () => format('bold'));
	expect(textbox.querySelector('b')).not.toBeInTheDocument();
	expect(textbox).toHaveTextContent('Hello, my dear friends!');

	// Apply and remove italic
	await act(async () => format('italic'));
	expect(textbox.querySelector('em')).toHaveTextContent('Hello, my dear friends!');

	await act(async () => format('italic'));
	expect(textbox.querySelector('em')).not.toBeInTheDocument();
	expect(textbox).toHaveTextContent('Hello, my dear friends!');
});

test('Formats selected text', async () => {
	const content = 'Hello, my dear friends!';
	const { format } = await renderRichEditor({ value: content });

	// Select text
	const textElement = await screen.findByText('Hello, my dear friends!');
	const textNode = textElement.firstChild;
	expect(textNode).toBeInstanceOf(Text);
	selectText(textNode as Text, 0, content.length);

	await act(async () => format('italic'));
	await act(async () => format('bold'));
	await act(async () => format('strikethrough'));

	const textbox = screen.getByRole('textbox');
	expect(textbox.querySelector('b > del > em')).toHaveTextContent(
		'Hello, my dear friends!',
	);
});
