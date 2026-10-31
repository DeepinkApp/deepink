import { act } from 'react';
import { page, userEvent } from 'vitest/browser';

import { renderRichEditorInDOM } from '../utils/renderEditorInDOM';
import { setCursorPosition } from '../utils/utils';

test('Pressing Enter inside a paragraph splits it into two paragraphs', async () => {
	await renderRichEditorInDOM({ value: 'My favorite dish is cake' });

	// Initial state
	const editor = page.getByRole('textbox');
	expect(editor.getByRole('paragraph')).toHaveLength(1);
	const paragraph = editor.getByRole('paragraph');
	expect(paragraph).toHaveRole('paragraph');
	expect(paragraph).toHaveTextContent('My favorite dish is cake');

	// Place cursor and press Enter
	await act(async () => {
		await paragraph.click();
		setCursorPosition(paragraph.element(), 'My favorite dis'.length);
		await userEvent.keyboard('{Enter}');
	});

	// Editor should now have two paragraphs split at the cursor
	const paragraphs = editor.getByRole('paragraph');
	expect(paragraphs).toHaveLength(2);

	expect(paragraphs.nth(0)).toHaveTextContent('My favorite dis');

	expect(paragraphs.nth(1)).toHaveTextContent('h is cake');
});

test('Ctrl+Enter exits a block node and creates a new empty paragraph', async () => {
	const content = 'This is a blockquote';
	const richEditor = await renderRichEditorInDOM({ value: `> ${content}` });

	// One blockquote with one paragraph inside
	const editor = page.getByRole('textbox');
	expect(editor.getByRole('blockquote')).toHaveLength(1);
	expect(editor.getByRole('blockquote')).toHaveTextContent(content);

	expect(editor.getByRole('paragraph')).toHaveLength(1);

	// Press Ctrl+Enter to exit the blockquote
	await act(async () => {
		const paragraph = editor.getByRole('blockquote').getByRole('paragraph');
		await paragraph.click();
		await userEvent.keyboard('{End}{Control>}{Enter}{/Control}');
	});

	// New empty paragraph is added
	expect(editor.getByRole('blockquote')).toHaveLength(1);
	expect(editor.getByRole('paragraph')).toHaveLength(2);

	const paragraphs = editor.getByRole('paragraph');
	expect(paragraphs.nth(0)).toHaveTextContent(content);
	expect(paragraphs.nth(1)).toHaveTextContent('');

	// Insert the current date from the context menu into the new paragraph.
	await richEditor.openContextMenu(paragraphs.nth(1), ['Insert', 'Current date']);
	const insertedDate = paragraphs.nth(1).element().textContent ?? '';
	expect(insertedDate).not.toBe('');
	expect(editor.getByRole('blockquote')).not.toHaveTextContent(insertedDate);
});
