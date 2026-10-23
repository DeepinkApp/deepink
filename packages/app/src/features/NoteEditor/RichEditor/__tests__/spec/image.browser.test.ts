/* eslint-disable no-bitwise */
import { act } from 'react';
import { page, userEvent } from 'vitest/browser';

import { renderRichEditorInDOM } from '../utils/renderEditorInDOM';
import { setCursorPosition } from '../utils/utils';

const EXAMPLE_IMAGE_URL = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

test(`Inserts image between text nodes`, async () => {
	const richEditor = await renderRichEditorInDOM({
		value: `My favorite image\n\n\n\nI love cat`,
	});

	const editor = page.getByRole('textbox');
	const firstParagraph = editor.getByRole('paragraph').nth(0);
	await act(async () => {
		await firstParagraph.click();
		setCursorPosition(firstParagraph.element(), 'My favorite image'.length);
	});

	await richEditor.openContextMenu(firstParagraph, ['Insert', 'Remote image...']);
	const dialog = page.getByRole('dialog');
	const urlInput = dialog.getByRole('textbox', { name: 'Image URL' });
	const altInput = dialog.getByRole('textbox', { name: 'Image alt text (optional)' });
	await userEvent.fill(urlInput, EXAMPLE_IMAGE_URL);
	await userEvent.fill(altInput, 'My cat');
	await dialog.getByRole('button', { name: 'Update' }).click();

	// Image insertion renders asynchronously while the image is loaded.
	const img = editor.getByRole('img');
	await expect.poll(() => img).toBeInTheDocument();
	expect(img).toHaveAttribute('src', EXAMPLE_IMAGE_URL);
	expect(img).toHaveAttribute('alt', 'My cat');

	// Image between two texts
	const firstText = editor.getByText('My favorite image');
	const secondText = editor.getByText('I love cat');
	expect(
		Boolean(
			firstText.element().compareDocumentPosition(img.element()) &
			Node.DOCUMENT_POSITION_FOLLOWING,
		),
	).toBe(true);
	expect(
		Boolean(
			img.element().compareDocumentPosition(secondText.element()) &
			Node.DOCUMENT_POSITION_FOLLOWING,
		),
	).toBe(true);

	// Editor contains only expected nodes
	const editorChildren = editor.element().children;
	expect(editorChildren).toHaveLength(3);
	Array.from(editorChildren).forEach((child) => {
		expect(child).toHaveRole('paragraph');
	});

	// First paragraph contains text and image
	expect(editorChildren[0]).toContainElement(img.element());
	expect(editorChildren[0]).toHaveTextContent('My favorite image');
	expect(editorChildren[1]).toHaveTextContent('');
	expect(editorChildren[2]).toHaveTextContent('I love cat');
});

test('Inserts image after block node', async () => {
	const richEditor = await renderRichEditorInDOM({
		value: '```js\nconst a = 1;\n```',
	});

	// Place cursor position inside the code node
	const editor = page.getByRole('textbox');
	const codeNode = editor.getByRole('code');
	await act(async () => {
		await codeNode.click();
		setCursorPosition(codeNode.element(), 10);
	});

	await richEditor.openContextMenu(codeNode, ['Insert', 'Remote image...']);
	const dialog = page.getByRole('dialog');
	await userEvent.fill(
		dialog.getByRole('textbox', { name: 'Image URL' }),
		EXAMPLE_IMAGE_URL,
	);
	await userEvent.fill(
		dialog.getByRole('textbox', { name: 'Image alt text (optional)' }),
		'My cat',
	);
	await dialog.getByRole('button', { name: 'Update' }).click();

	// Image insertion renders asynchronously while the image is loaded.
	const img = editor.getByRole('img');
	await expect.poll(() => img).toBeInTheDocument();

	expect(codeNode).toBeInTheDocument();

	// Image is inserted as next sibling of the code block
	expect(codeNode.element().nextElementSibling).toContainElement(img.element());

	const editorChildren = editor.element().children;
	expect(editorChildren).toHaveLength(2);
	expect(editorChildren[0]).toHaveRole('code');
	expect(editorChildren[1]).toHaveRole('paragraph');

	// Image is inside the paragraph
	expect(editorChildren[1]).toContainElement(img.element());
});
