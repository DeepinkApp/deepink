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
	const createPlayground = async () => {
		const { destroy, insert } = await renderRichEditorInDOM({
			value: sampleText,
		});
		onTestFinished(destroy);

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

	test('Update link URL', async () => {
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

	test('Update link URL via keyboard', async () => {
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

	test('Convert link to text', async () => {
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
