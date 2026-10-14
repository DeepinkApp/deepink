import { act, createRef } from 'react';
import { page, userEvent } from 'vitest/browser';

import { RichEditorAPI } from '../../RichEditorContent';

import { renderRichEditorInDOM } from '../utils/renderEditorInDOM';

test('insertion into empty editor creates code block on first paragraph', async () => {
	const editorApi = createRef<RichEditorAPI>();
	const editor = await renderRichEditorInDOM({
		value: '',
		apiRef: editorApi,
	});

	const editorLocator = page.elementLocator(editor.container);
	expect(editorLocator.getByRole('paragraph')).toHaveLength(1);

	// Focus on empty editor via editor API
	expect(editorApi.current).haveOwnProperty('focus');
	await act(async () => {
		editorApi.current?.focus();
	});
	await editor.insert({ type: 'code' });

	expect(editorLocator.getByRole('code')).toHaveLength(1);
	expect(editorLocator.getByRole('paragraph')).toHaveLength(0);
});

test('insertion converts paragraph and its content into a code block', async () => {
	const editorApi = createRef<RichEditorAPI>();
	const editor = await renderRichEditorInDOM({
		value: '',
		apiRef: editorApi,
	});

	const editorLocator = page.elementLocator(editor.container);
	expect(editorLocator.getByRole('paragraph')).toHaveLength(1);

	// Focus on empty editor via editor API
	expect(editorApi.current).haveOwnProperty('focus');
	await act(async () => {
		await editorLocator.click();
	});

	// Add one paragraph
	await act(async () => {
		await userEvent.keyboard('Some code here');
	});
	expect(editorLocator.getByRole('paragraph')).toHaveTextContent('Some code here');

	// Convert it
	await editor.insert({ type: 'code' });

	expect(editorLocator.getByRole('code')).toHaveLength(1);
	expect(editorLocator.getByRole('code')).toHaveTextContent('Some code here');
	expect(editorLocator.getByRole('paragraph')).toHaveLength(0);
});
