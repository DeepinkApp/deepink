import { act } from 'react';
import { page, userEvent } from 'vitest/browser';

import { renderRichEditorInDOM } from '../utils/renderEditorInDOM';
import { setCursorPosition } from '../utils/utils';

test('Editor is not editable in readonly mode', async () => {
	await renderRichEditorInDOM({
		value: '# Hello',
		isReadOnly: true,
	});

	const editor = page.getByRole('textbox');
	expect(editor).toHaveAttribute('contenteditable', 'false');

	// Cannot enter text
	await act(async () => {
		await page.getByRole('heading').click();
		await userEvent.keyboard('Some text');
	});

	expect(editor).toHaveTextContent('Hello');
	expect(editor).not.toHaveTextContent('Some text');
});

test('Read-only editor is not editable while the other editor remains editable', async () => {
	await renderRichEditorInDOM({ value: 'Editable text' });
	await renderRichEditorInDOM({ value: 'ReadOnly text', isReadOnly: true });

	const textBoxes = page.getByRole('textbox');
	expect(textBoxes).toHaveLength(2);

	const editable = textBoxes.nth(0);
	const readOnly = textBoxes.nth(1);
	expect(editable).toHaveAttribute('contenteditable', 'true');
	expect(readOnly).toHaveAttribute('contenteditable', 'false');

	// editorA is editable — editing works
	await act(async () => {
		await editable.getByText('Editable text').click();
		setCursorPosition(editable.getByText('Editable text').element(), 0);
		await userEvent.keyboard('New text ');
	});

	expect(editable).toHaveTextContent('New text Editable text');

	// editorB is readOnly — editing must be ignored
	await act(async () => {
		await readOnly.getByText('ReadOnly text').click();
		await userEvent.keyboard('Some text');
	});

	expect(readOnly).toHaveTextContent('ReadOnly text');
	expect(readOnly).not.toHaveTextContent('Some text');
	expect(readOnly).toHaveAttribute('contenteditable', 'false');
});
