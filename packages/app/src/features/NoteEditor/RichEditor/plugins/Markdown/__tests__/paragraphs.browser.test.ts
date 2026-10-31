import { act } from 'react';
import { page, userEvent } from 'vitest/browser';
import { renderRichEditorInDOM } from '@features/NoteEditor/RichEditor/__tests__/utils/renderEditorInDOM';
import { setCursorPosition } from '@features/NoteEditor/RichEditor/__tests__/utils/utils';

import { $convertToMarkdownString, parseMarkdownToAST } from '../markdownParser';

test('Exact paragraphs count must be preserved', async () => {
	const { getEditor } = await renderRichEditorInDOM({ value: '' });

	const textbox = page.getByRole('textbox');
	const paragraph = page.getByRole('paragraph');

	await expect.element(textbox).toBeVisible();
	await expect.poll(() => paragraph.all()).toHaveLength(1);
	await expect.element(paragraph).toHaveTextContent('');

	await act(async () => {
		await textbox.click();
		await userEvent.keyboard('Hello');
	});
	await expect.poll(() => paragraph.all()).toHaveLength(1);
	await expect.element(paragraph).toHaveTextContent('Hello');

	await act(async () => {
		await paragraph.click();
		setCursorPosition(paragraph.element(), 'Hello'.length);
		await userEvent.keyboard('{Enter}');
	});
	await expect.poll(() => paragraph.all()).toHaveLength(2);
	await act(async () => {
		await userEvent.keyboard('World');
	});
	expect(paragraph.nth(0)).toHaveTextContent('Hello');
	expect(paragraph.nth(1)).toHaveTextContent('World');

	const serializedOut = getEditor().read(() => $convertToMarkdownString());
	expect(parseMarkdownToAST(serializedOut).children).toHaveLength(2);
});

test('Empty paragraphs must be preserved', async () => {
	const { getEditor } = await renderRichEditorInDOM({ value: '' });

	const textbox = page.getByRole('textbox');
	const paragraph = page.getByRole('paragraph');

	await expect.element(textbox).toBeVisible();
	await expect.poll(() => paragraph.all()).toHaveLength(1);
	await expect.element(paragraph).toHaveTextContent('');

	await act(async () => {
		await textbox.click();
		await userEvent.keyboard('Hello');
	});
	await expect.poll(() => paragraph.all()).toHaveLength(1);
	await expect.element(paragraph).toHaveTextContent('Hello');

	await act(async () => {
		await paragraph.click();
		setCursorPosition(paragraph.element(), 'Hello'.length);
		await userEvent.keyboard('{Enter}'.repeat(3));
	});
	await expect.poll(() => paragraph.all()).toHaveLength(4);
	await act(async () => {
		await userEvent.keyboard('World');
	});
	expect(paragraph.nth(0)).toHaveTextContent('Hello');
	expect(paragraph.nth(1)).toHaveTextContent('');
	expect(paragraph.nth(2)).toHaveTextContent('');
	expect(paragraph.nth(3)).toHaveTextContent('World');

	const serializedOut = getEditor().read(() => $convertToMarkdownString());
	expect(parseMarkdownToAST(serializedOut).children).toHaveLength(4);
});
