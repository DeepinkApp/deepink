import { act } from 'react';
import { page, userEvent } from 'vitest/browser';

import { renderRichEditorInDOM } from '../utils/renderEditorInDOM';
import { selectText } from '../utils/utils';

vi.mock('electron', () => () => {});

test('Convert selected text into link', async () => {
	const { destroy, insert, getEditor } = await renderRichEditorInDOM({
		value: 'My favorite dish is cake',
	});
	onTestFinished(destroy);

	// Initial state
	const editor = page.getByRole('textbox');
	expect(editor.getByRole('link')).not.toBeInTheDocument();

	await act(async () => {
		selectText(getEditor().getRootElement()!, 'favorite');
	});

	await insert({ type: 'link', data: { url: 'https://example.com' } });
	expect(editor.getByRole('link', { name: /^favorite$/ })).toBeInTheDocument();
	expect(editor.element().outerHTML).toMatchSnapshot();
});

test('Insert link with no text', async () => {
	const { destroy, insert } = await renderRichEditorInDOM({
		value: 'My favorite dish is cake',
	});
	onTestFinished(destroy);

	// Initial state
	const editor = page.getByRole('textbox');
	expect(editor.getByRole('link')).not.toBeInTheDocument();

	await act(async () => {
		await editor.click();
		await userEvent.keyboard('{Space}');
	});

	await insert({ type: 'link', data: { url: 'https://example.com' } });
	expect(editor.getByRole('link', { name: 'https://example.com' })).toBeInTheDocument();
	expect(editor.element().outerHTML).toMatchSnapshot();
});
