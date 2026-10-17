import { act } from 'react';
import { page } from 'vitest/browser';

import { renderRichEditorInDOM } from '../utils/renderEditorInDOM';
import { selectContent } from '../utils/utils';

describe('Blocks conversion', () => {
	test('code block can be converted into paragraph', async () => {
		const text = '2+2*2 !== 8;';
		const editor = await renderRichEditorInDOM({
			value: '```javascript\n' + text + '\n```',
		});

		const editorLocator = page.elementLocator(editor.container);
		const codeLocator = editorLocator.getByRole('code');
		expect(codeLocator).toHaveLength(1);

		await editor.openContextMenu(codeLocator, ['Block type', 'Paragraph']);

		expect(editorLocator.getByRole('paragraph')).toHaveLength(1);
		expect(editorLocator.getByRole('paragraph')).toHaveTextContent(text);
		expect(codeLocator).not.toBeInTheDocument();
	});

	test('quote can be converted into paragraph', async () => {
		const text = 'A room without books is like a body without a soul.';
		const editor = await renderRichEditorInDOM({
			value: `> ${text}`,
		});

		const editorLocator = page.elementLocator(editor.container);
		const quoteLocator = editorLocator.getByRole('blockquote');
		expect(quoteLocator).toHaveLength(1);

		await editor.openContextMenu(quoteLocator, ['Block type', 'Paragraph']);

		expect(editorLocator.getByRole('paragraph')).toHaveLength(1);
		expect(editorLocator.getByRole('paragraph')).toHaveTextContent(text);
		expect(quoteLocator).not.toBeInTheDocument();
	});

	test('complex quote can be converted into paragraph', async () => {
		const text =
			'Everybody is a genius. But if you judge a fish by its ability to climb a tree, it will live its whole life believing that is is stupid.';
		const editor = await renderRichEditorInDOM({
			value: `> ### The man who loves to call everything stupid\n> ${text}\n>\n> **Albert Einstein** - the passionate amateur violinist.`,
		});

		const editorLocator = page.elementLocator(editor.container);

		const quoteLocator = editorLocator.getByRole('blockquote');
		expect(quoteLocator).toHaveLength(1);

		const headingLocator = editorLocator.getByRole('heading');
		expect(headingLocator).toHaveLength(1);

		await editor.openContextMenu(quoteLocator, ['Block type', 'Paragraph']);

		expect(headingLocator).toHaveLength(1);
		expect(editorLocator.getByRole('paragraph')).toHaveLength(2);
		expect(quoteLocator).not.toBeInTheDocument();
	});

	test('only node nearest to cursor must be converted', async () => {
		const text =
			'Everybody is a genius. But if you judge a fish by its ability to climb a tree, it will live its whole life believing that is is stupid.';
		const editor = await renderRichEditorInDOM({
			value: `> ### The man who loves to call everything stupid\n> ${text}\n>\n> **Albert Einstein** - the passionate amateur violinist.`,
		});

		const editorLocator = page.elementLocator(editor.container);

		const quoteLocator = editorLocator.getByRole('blockquote');
		expect(quoteLocator).toHaveLength(1);

		const headingLocator = editorLocator.getByRole('heading');
		expect(headingLocator).toHaveLength(1);

		await editor.openContextMenu(headingLocator, ['Block type', 'Paragraph']);

		expect(headingLocator).not.toBeInTheDocument();
		expect(editorLocator.getByRole('paragraph')).toHaveLength(3);
		expect(quoteLocator).toHaveLength(1);
	});

	test('common ancestor must be converted when multiple nodes is selected', async () => {
		const text =
			'Everybody is a genius. But if you judge a fish by its ability to climb a tree, it will live its whole life believing that is is stupid.';
		const editor = await renderRichEditorInDOM({
			value: `> ### The man who loves to call everything stupid\n> ${text}\n>\n> **Albert Einstein** - the passionate amateur violinist.`,
		});

		const editorLocator = page.elementLocator(editor.container);

		const quoteLocator = editorLocator.getByRole('blockquote');
		expect(quoteLocator).toHaveLength(1);

		const headingLocator = editorLocator.getByRole('heading');
		expect(headingLocator).toHaveLength(1);

		await act(async () => {
			selectContent(
				editorLocator.element() as HTMLElement,
				headingLocator.element().textContent,
				text,
			);
		});
		await editor.openContextMenu(headingLocator, ['Block type', 'Paragraph']);

		expect(editorLocator.getByRole('paragraph')).toHaveLength(2);
		expect(quoteLocator).toHaveLength(0);
		expect(headingLocator).toHaveLength(1);
	});
});
