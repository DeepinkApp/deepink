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

describe('Link context menu', () => {
	const sampleText = 'My favorite dish is cake';

	test('Update link URL', async () => {
		const { destroy, insert } = await renderRichEditorInDOM({
			value: sampleText,
		});
		onTestFinished(destroy);

		const editor = page.getByRole('textbox');
		const linkLocator = editor.getByRole('link');

		// No link
		expect(linkLocator).not.toBeInTheDocument();

		// Convert selected text into link
		await act(async () => {
			selectText(editor.element(), 'favorite');
		});
		await insert({ type: 'link', data: { url: 'https://example.com' } });

		expect(linkLocator).toBeInTheDocument();
		expect(linkLocator).toHaveTextContent(/^favorite$/);
		expect(linkLocator).toHaveAttribute('href', 'https://example.com');

		// Open context menu
		await act(async () => {
			await userEvent.hover(linkLocator);
			await userEvent.click(linkLocator, { button: 'right' });
		});

		expect(page.getByRole('form')).toBeInTheDocument();

		// Update URL
		const inputLocator = page.getByRole('form').getByRole('textbox');
		expect(inputLocator).toBeInTheDocument();
		expect(inputLocator).toHaveValue('https://example.com');

		await act(async () => {
			await userEvent.fill(inputLocator, 'https://updated.example.com');
			await page.getByRole('button', { exact: true, name: 'Update URL' }).click();
		});

		expect(linkLocator).toHaveAttribute('href', 'https://updated.example.com');
	});

	test('Convert link to text', async () => {
		const { destroy, insert } = await renderRichEditorInDOM({
			value: sampleText,
		});
		onTestFinished(destroy);

		const editor = page.getByRole('textbox');
		const linkLocator = editor.getByRole('link');

		// No link
		const snapshotBeforeChanges = editor.element().outerHTML;
		expect(linkLocator).not.toBeInTheDocument();

		// Convert selected text into link
		await act(async () => {
			selectText(editor.element(), 'favorite');
		});
		await insert({ type: 'link', data: { url: 'https://example.com' } });

		expect(linkLocator).toBeInTheDocument();
		expect(linkLocator).toHaveTextContent(/^favorite$/);
		expect(linkLocator).toHaveAttribute('href', 'https://example.com');

		// Open context menu
		await act(async () => {
			await userEvent.hover(linkLocator);
			await userEvent.click(linkLocator, { button: 'right' });
		});

		expect(page.getByRole('form')).toBeInTheDocument();

		// Convert link to text
		await act(async () => {
			await page
				.getByRole('button', { exact: true, name: 'Convert link to text' })
				.click();
		});

		expect(linkLocator).not.toBeInTheDocument();
		expect(editor.element().outerHTML).toBe(snapshotBeforeChanges);
	});
});
