import { act } from 'react';
import { page, userEvent } from 'vitest/browser';

import { renderRichEditorInDOM } from '../utils/renderEditorInDOM';
import { selectText } from '../utils/utils';

vi.mock('electron', () => () => {});

test('Selected text must be converted into link', async () => {
	const { insert } = await renderRichEditorInDOM({
		value: 'My favorite dish is cake',
	});

	const editorLocator = page.getByRole('textbox');
	expect(editorLocator).toBeInTheDocument();

	const linkLocator = editorLocator.getByRole('link');
	expect(linkLocator).not.toBeInTheDocument();

	await act(async () => {
		selectText(editorLocator.element(), 'favorite');
	});

	await insert({ type: 'link', data: { url: 'https://example.com' } });
	expect(linkLocator).toBeInTheDocument();
	expect(linkLocator).toHaveTextContent(/^favorite$/);
	expect(linkLocator).toHaveAttribute('href', 'https://example.com');
	expect(editorLocator.element().outerHTML).toMatchSnapshot();
});

test('Link insertion with no text selection must create a link with url as a text', async () => {
	const { insert } = await renderRichEditorInDOM({
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

	await insert({ type: 'link', data: { url: 'https://example.com' } });

	expect(linkLocator).toBeInTheDocument();
	expect(linkLocator.element().textContent).toBe('https://example.com');
	expect(linkLocator).toHaveAttribute('href', 'https://example.com');
	expect(editorLocator.element().outerHTML).toMatchSnapshot();
});

describe('Link context menu', () => {
	const sampleText = 'My favorite dish is cake';
	const createPlayground = async () => {
		const { insert } = await renderRichEditorInDOM({
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
			await insert({ type: 'link', data: { url: 'https://example.com' } });

			expect(linkLocator).toBeInTheDocument();
			expect(linkLocator).toHaveTextContent(/^favorite$/);
			expect(linkLocator).toHaveAttribute('href', 'https://example.com');
		};

		const openContextMenu = async () => {
			await act(async () => {
				await userEvent.hover(linkLocator);
				await userEvent.click(linkLocator, { button: 'right' });
			});

			expect(page.getByRole('form')).toBeInTheDocument();
		};

		return {
			makeLink,
			openContextMenu,
			locators: {
				editor: editorLocator,
				link: linkLocator,
				menu: page.getByRole('form'),
			},
		};
	};

	test('Link URL can be updated via menu', async () => {
		const { makeLink, openContextMenu, locators } = await createPlayground();

		await makeLink();
		expect(locators.link).toHaveAttribute('href', 'https://example.com');

		await openContextMenu();

		const inputLocator = locators.menu.getByRole('textbox');
		expect(inputLocator).toBeInTheDocument();
		expect(inputLocator).toHaveValue('https://example.com');

		// Update URL
		await act(async () => {
			await userEvent.fill(inputLocator, 'https://updated.example.com');
			await page.getByRole('button', { exact: true, name: 'Update URL' }).click();
		});

		expect(locators.link).toHaveAttribute('href', 'https://updated.example.com');
	});

	test('Link URL can be updated via keyboard interaction in menu', async () => {
		const { makeLink, openContextMenu, locators } = await createPlayground();

		await makeLink();
		expect(locators.link).toHaveAttribute('href', 'https://example.com');

		await openContextMenu();

		const inputLocator = locators.menu.getByRole('textbox');
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
		const { makeLink, openContextMenu, locators } = await createPlayground();

		// No link
		const snapshotBeforeChanges = locators.editor.element().outerHTML;
		expect(locators.link).not.toBeInTheDocument();

		// Convert link to text
		await makeLink();
		await openContextMenu();
		await act(async () => {
			await page
				.getByRole('button', { exact: true, name: 'Convert link to text' })
				.click();
		});

		expect(locators.link).not.toBeInTheDocument();
		expect(locators.editor.element().outerHTML).toBe(snapshotBeforeChanges);
	});
});
