import { screen, within } from '@testing-library/react';

import { renderRichEditor } from '../utils/renderRichEditor';
import { setCursorPosition } from '../utils/utils';

const EXAMPLE_IMAGE_URL =
	'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fc/Pieter_Bruegel_the_Elder_-_The_Tower_of_Babel_%28Vienna%29_-_Google_Art_Project_-_edited.jpg/500px-Pieter_Bruegel_the_Elder_-_The_Tower_of_Babel_%28Vienna%29_-_Google_Art_Project_-_edited.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail';

test(`Inserts image between text nodes`, async () => {
	const richEditor = await renderRichEditor({
		value: `My favorite image\n\n\n\nI love cat`,
	});

	const editor = screen.getByRole('textbox');
	setCursorPosition(editor, 'My favorite image'.length);

	// Simulate inserting an image via the editor panel action
	await richEditor.insert({
		type: 'image',
		data: { url: EXAMPLE_IMAGE_URL, altText: 'My cat' },
	});

	// Image nodes inserting asynchronously, so use findByRole to wait for the img to appear
	const img = await within(editor).findByRole('img');
	expect(img).toBeInTheDocument();
	await expect
		.poll(() => within(editor).findByRole('img'))
		.toHaveAttribute('src', EXAMPLE_IMAGE_URL);
	expect(img).toHaveAttribute('alt', 'My cat');

	// Image between two texts
	const firstText = within(editor).getByText('My favorite image');
	const secondText = within(editor).getByText('I love cat');
	expect(img).toAppearAfter(firstText);
	expect(img).toAppearBefore(secondText);

	// Editor contains only expected nodes
	const editorChildren = editor.children;
	expect(editorChildren).toHaveLength(3);
	Array.from(editor.children).forEach((child) => {
		expect(child).toHaveRole('paragraph');
	});

	// First paragraph contains text and image
	expect(editorChildren[0]).toContainElement(img);
	expect(editorChildren[0]).toHaveTextContent('My favorite image');
	expect(editorChildren[1]).toHaveTextContent('');
	expect(editorChildren[2]).toHaveTextContent('I love cat');
});

test('Inserts image after block node', async () => {
	const richEditor = await renderRichEditor({
		value: '```js\nconst a = 1;\n```',
	});

	// Place cursor position inside the code node
	const editor = screen.getByRole('textbox');
	setCursorPosition(within(editor).getByRole('code'), 10);

	await richEditor.insert({
		type: 'image',
		data: { url: EXAMPLE_IMAGE_URL, altText: 'My cat' },
	});

	// Wait before image to appear
	const img = await within(editor).findByRole('img');
	expect(img).toBeInTheDocument();

	const codeNode = within(editor).getByRole('code');
	expect(codeNode).toBeInTheDocument();

	// Image is inserted as next sibling of the code block
	expect(img).toAppearAfter(codeNode);
	expect(codeNode.nextElementSibling).toContainElement(img);

	const editorChildren = editor.children;
	expect(editorChildren).toHaveLength(2);
	expect(editorChildren[0]).toHaveRole('code');
	expect(editorChildren[1]).toHaveRole('paragraph');

	// Image is inside the paragraph
	expect(editorChildren[1]).toContainElement(img);
});
