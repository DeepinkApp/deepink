import { act } from 'react';
import { page, userEvent } from 'vitest/browser';

import { renderRichEditorInDOM, RichEditorTestAPI } from '../utils/renderEditorInDOM';
import { selectText } from '../utils/utils';

const insertLink = async (editor: RichEditorTestAPI, url: string) => {
	await editor.openContextMenu(['Add link...']);

	const dialogLocator = page.getByRole('dialog');
	expect(dialogLocator).toBeInTheDocument();

	const urlLocator = dialogLocator.getByRole('textbox', { name: 'URL' });
	await urlLocator.click();
	await userEvent.fill(urlLocator, url);

	await dialogLocator.getByRole('button', { name: 'Insert' }).click();
	expect(dialogLocator).not.toBeInTheDocument();
};

test('Selected text must be converted into link', async () => {
	const editor = await renderRichEditorInDOM({
		value: 'My favorite dish is cake',
	});

	const editorLocator = page.getByRole('textbox');
	expect(editorLocator).toBeInTheDocument();

	const linkLocator = editorLocator.getByRole('link');
	expect(linkLocator).not.toBeInTheDocument();

	await act(async () => {
		selectText(editorLocator.element(), 'favorite');
	});

	await insertLink(editor, 'https://example.com');
	expect(linkLocator).toBeInTheDocument();
	expect(linkLocator).toHaveTextContent(/^favorite$/);
	expect(linkLocator).toHaveAttribute('href', 'https://example.com');
	expect(editorLocator.element().outerHTML).toMatchSnapshot();
});

test('Link insertion with no text selection must create a link with url as a text', async () => {
	const editor = await renderRichEditorInDOM({
		value: 'My favorite dish is cake',
	});

	const editorLocator = page.getByRole('textbox');
	expect(editorLocator).toBeInTheDocument();

	const linkLocator = editorLocator.getByRole('link');
	expect(linkLocator).not.toBeInTheDocument();

	await act(async () => {
		await editorLocator.click();
		await userEvent.keyboard('{Space}');
	});

	await insertLink(editor, 'https://example.com');
	expect(linkLocator).toBeInTheDocument();
	expect(linkLocator.element().textContent).toBe('https://example.com');
	expect(linkLocator).toHaveAttribute('href', 'https://example.com');
	expect(editorLocator.element().outerHTML).toMatchSnapshot();
});

describe('Link context menu', () => {
	const sampleText = 'My favorite dish is cake';
	const createPlayground = async () => {
		const editor = await renderRichEditorInDOM({
			value: sampleText,
		});

		const editorLocator = page.getByRole('textbox');
		const linkLocator = editorLocator.getByRole('link');

		// No link
		expect(linkLocator).not.toBeInTheDocument();

		// Convert selected text into link
		const makeLink = async () => {
			await act(async () => {
				selectText(editorLocator.element(), 'favorite');
			});
			await insertLink(editor, 'https://example.com');

			expect(linkLocator).toBeInTheDocument();
			expect(linkLocator).toHaveTextContent(/^favorite$/);
			expect(linkLocator).toHaveAttribute('href', 'https://example.com');
		};

		return {
			editor,
			makeLink,
			locators: {
				editor: editorLocator,
				link: linkLocator,
			},
		};
	};

	test('Link URL can be updated via menu', async () => {
		const { editor, makeLink, locators } = await createPlayground();

		await makeLink();
		expect(locators.link).toHaveAttribute('href', 'https://example.com');

		await editor.openContextMenu(locators.link, ['Edit link...']);

		const inputLocator = page
			.getByRole('dialog')
			.getByRole('textbox', { name: 'Link URL' });
		expect(inputLocator).toBeInTheDocument();
		expect(inputLocator).toHaveValue('https://example.com');

		// Update URL
		await act(async () => {
			await userEvent.fill(inputLocator, 'https://updated.example.com');
			await page.getByRole('button', { name: 'Update' }).click();
		});

		expect(locators.link).toHaveAttribute('href', 'https://updated.example.com');
	});

	test('Link URL can be updated via keyboard interaction in menu', async () => {
		const { editor, makeLink, locators } = await createPlayground();

		await makeLink();
		expect(locators.link).toHaveAttribute('href', 'https://example.com');

		await editor.openContextMenu(locators.link, ['Edit link...']);

		const inputLocator = page
			.getByRole('dialog')
			.getByRole('textbox', { name: 'Link URL' });
		expect(inputLocator).toBeInTheDocument();
		expect(inputLocator).toHaveValue('https://example.com');

		// Update URL
		await act(async () => {
			await userEvent.fill(inputLocator, 'https://updated.example.com');
			await userEvent.keyboard('{Enter}');
		});

		expect(locators.link).toHaveAttribute('href', 'https://updated.example.com');
	});

	test('Link can be converted into text', async () => {
		const { editor, makeLink, locators } = await createPlayground();

		// No link
		const snapshotBeforeChanges = locators.editor.element().outerHTML;
		expect(locators.link).not.toBeInTheDocument();

		// Convert link to text
		await makeLink();
		expect(locators.link).toBeInTheDocument();

		await editor.openContextMenu(locators.link, ['Remove link']);

		expect(locators.link).not.toBeInTheDocument();
		expect(locators.editor.element().outerHTML).toBe(snapshotBeforeChanges);
	});
});
