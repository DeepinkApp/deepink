import { act } from 'react';
import { page, userEvent } from 'vitest/browser';
import { renderRichEditorInDOM } from '@features/NoteEditor/RichEditor/__tests__/utils/renderEditorInDOM';

import { $convertToMarkdownString, parseMarkdownToAST } from '../markdownParser';

test('Exact paragraphs count must be preserved', async () => {
	const { getEditor } = await renderRichEditorInDOM({ value: '' });

	const textbox = page.getByRole('textbox');
	const paragraph = page.getByRole('paragraph');

	await expect.element(textbox).toBeVisible();
	await expect.poll(() => paragraph.all()).toHaveLength(1);
	await expect.element(paragraph).toHaveTextContent('');

	await act(async () => {
		await userEvent.click(textbox);
		await userEvent.keyboard('Hello');
	});
	await expect.poll(() => paragraph.all()).toHaveLength(1);

	await act(async () => {
		await userEvent.keyboard('{Enter}World');
	});
	await expect.poll(() => paragraph.all()).toHaveLength(2);

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
		await userEvent.click(textbox);
		await userEvent.keyboard('Hello');
	});
	await expect.poll(() => paragraph.all()).toHaveLength(1);

	await act(async () => {
		await userEvent.keyboard('{Enter}'.repeat(3) + 'World');
	});
	await expect.poll(() => paragraph.all()).toHaveLength(4);

	const serializedOut = getEditor().read(() => $convertToMarkdownString());
	expect(parseMarkdownToAST(serializedOut).children).toHaveLength(4);
});
