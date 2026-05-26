import { readFileSync } from 'fs';
import path from 'path';
import { screen } from '@testing-library/react';

import { renderRichEditor } from './utils/renderRichEditor';

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

test(`Correct for image md`, async () => {
	await renderRichEditor({
		value: `# Image ![My cat](http://example.com/cat.png) - my favorite image`,
	});

	const img = await screen.findByRole('img');

	expect(img).toBeInTheDocument();
	expect(img).toHaveAttribute('src', 'http://example.com/cat.png');
	expect(img).toHaveAttribute('alt', 'My cat');
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
