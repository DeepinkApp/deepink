import { act } from 'react';
import { page } from 'vitest/browser';

import { renderRichEditorInDOM } from '../utils/renderEditorInDOM';
import { selectContent } from '../utils/utils';

test('Updates heading level correctly', async () => {
	const content = 'Hello, my dear friends!';
	const richEditor = await renderRichEditorInDOM({ value: content });

	const editor = page.getByRole('textbox');
	await editor.click();
	await act(async () => {
		selectContent(editor.element(), content);
	});

	// Plain text becomes heading
	await richEditor.openContextMenu(editor.getByText(content), [
		'Paragraph',
		'Heading 1',
	]);
	expect(editor.getByRole('heading', { level: 1 })).toHaveTextContent(content);

	// Heading level is updated when different level applied
	await richEditor.openContextMenu(editor.getByRole('heading', { level: 1 }), [
		'Paragraph',
		'Heading 3',
	]);

	expect(editor.getByRole('heading', { level: 3 })).toHaveTextContent(content);
	expect(editor.getByRole('heading', { level: 1 })).not.toBeInTheDocument();

	// Heading reverts to paragraph when same level applied again
	await richEditor.openContextMenu(editor.getByRole('heading', { level: 3 }), [
		'Paragraph',
		'Heading 3',
	]);

	expect(editor.getByRole('heading')).not.toBeInTheDocument();
	expect(editor.getByText(content)).toBeInTheDocument();

	// After editing the screen should contain one paragraph with a text
	const editorChildren = editor.element().children;
	expect(editorChildren).toHaveLength(1);
	expect(editorChildren[0]).toHaveRole('paragraph');
	expect(editorChildren[0]).toHaveTextContent(content);
});
