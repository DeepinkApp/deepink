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

	const editor = page.getByRole('textbox');
	expect(editor.getByRole('link')).not.toBeInTheDocument();

	await act(async () => {
		selectText(getEditor().getRootElement()!, 'favorite');
	});

	await insert({ type: 'link', data: { url: 'https://example.com' } });
	expect(editor.getByRole('link', { name: /^favorite$/ })).toBeInTheDocument();
	expect(editor.element().outerHTML).toMatchSnapshot();
});

test('Convert link back to text', async () => {
	const sampleText = 'My favorite dish is cake';
	const { destroy, insert, getEditor } = await renderRichEditorInDOM({
		value: sampleText,
	});
	onTestFinished(destroy);

	const editor = page.getByRole('textbox');
	expect(editor.getByRole('link')).not.toBeInTheDocument();

	const snapshotBeforeChanges = editor.element().outerHTML;

	// Convert selected text into link
	await act(async () => {
		selectText(getEditor().getRootElement()!, 'favorite');
	});
	await insert({ type: 'link', data: { url: 'https://example.com' } });

	expect(
		editor.getByRole('link', { exact: true, name: 'favorite' }),
	).toBeInTheDocument();
	expect(editor.element().outerHTML).toMatchSnapshot();

	// Convert link back to text
	await act(async () => {
		const linkLocator = editor.getByRole('link', { exact: true, name: 'favorite' });
		await userEvent.hover(linkLocator);
		await userEvent.click(linkLocator, { button: 'right' });
		await page
			.getByRole('button', { exact: true, name: 'Convert link to text' })
			.click();
	});

	expect(editor.getByRole('link')).not.toBeInTheDocument();
	expect(editor.element().outerHTML).toBe(snapshotBeforeChanges);
});

test('Link insertion with no text selection must create a link with url as a text', async () => {
	const { destroy, insert } = await renderRichEditorInDOM({
		value: 'My favorite dish is cake',
	});
	onTestFinished(destroy);

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
