import { act } from 'react';
import { page, userEvent } from 'vitest/browser';

import { renderRichEditorInDOM } from '../utils/renderEditorInDOM';
import { selectContent, selectText } from '../utils/utils';

const formatStyles = {
	deleted: {
		'text-decoration': 'line-through',
	},
	italic: {
		'font-style': 'italic',
	},
	bold: {
		'font-weight': 'bold',
	},
} as const;

test('Text formatting can be toggled', async () => {
	const content = 'Hello, my dear friends!';
	const richEditor = await renderRichEditorInDOM({ value: content });

	const editor = page.getByRole('textbox');

	// Apply strikethrough
	await editor.click();
	await act(async () => selectContent(editor.element(), content));
	await richEditor.openContextMenu(editor.getByText(content), [
		'Format',
		'Strikethrough',
	]);
	expect(editor.getByText(content)).toHaveStyle(formatStyles.deleted);

	// Remove strikethrough
	await act(async () => selectContent(editor.element(), content));
	await richEditor.openContextMenu(editor.getByText(content), [
		'Format',
		'Strikethrough',
	]);
	expect(editor.getByText(content)).not.toHaveStyle(formatStyles.deleted);

	// Apply italic
	await act(async () => selectContent(editor.element(), content));
	await richEditor.openContextMenu(editor.getByText(content), ['Format', 'Italic']);
	expect(editor.getByText(content)).toHaveStyle(formatStyles.italic);

	// Remove italic
	await act(async () => selectContent(editor.element(), content));
	await richEditor.openContextMenu(editor.getByText(content), ['Format', 'Italic']);
	expect(editor.getByText(content)).not.toHaveStyle(formatStyles.italic);
});

test('One text node can have different formatting at once', async () => {
	const content = 'Hello, my dear friends!';
	const richEditor = await renderRichEditorInDOM({ value: content });

	const editor = page.getByRole('textbox');

	await editor.click();
	await act(async () => selectContent(editor.element(), content));
	await richEditor.openContextMenu(editor.getByText(content), ['Format', 'Italic']);
	await act(async () => selectContent(editor.element(), content));
	await richEditor.openContextMenu(editor.getByText(content), ['Format', 'Bold']);
	await act(async () => selectContent(editor.element(), content));
	await richEditor.openContextMenu(editor.getByText(content), [
		'Format',
		'Strikethrough',
	]);

	expect(editor.getByText(content)).toHaveStyle(formatStyles.bold);
	expect(editor.getByText(content)).toHaveStyle(formatStyles.italic);
	expect(editor.getByText(content)).toHaveStyle(formatStyles.deleted);

	// Removes bold without breaking others formatting
	await act(async () => selectContent(editor.element(), content));
	await richEditor.openContextMenu(editor.getByText(content), ['Format', 'Bold']);

	expect(editor.getByText(content)).not.toHaveStyle(formatStyles.bold);
	expect(editor.getByText(content)).toHaveStyle(formatStyles.italic);
	expect(editor.getByText(content)).toHaveStyle(formatStyles.deleted);
});

test('Formatting can be applied to a part of text', async () => {
	const richEditor = await renderRichEditorInDOM({ value: 'Hello, my dear friends!' });

	const editor = page.getByRole('textbox');
	await editor.click();

	// Apply formatting
	await act(async () => selectText(editor.element(), 'friends'));
	await richEditor.openContextMenu(editor.getByText('friends'), ['Format', 'Italic']);

	expect(editor.getByText('friends')).toHaveStyle(formatStyles.italic);
	expect(editor.getByText('Hello')).not.toHaveStyle(formatStyles.italic);
});

describe('Formatting via keyboard shortcuts', () => {
	const cases = [
		{
			title: 'Ctrl+I must toggle Italic format',
			shortcut: '{Control>}i{/Control}',
			formatClass: formatStyles.italic,
		},
		{
			title: 'Ctrl+B must toggle Bold format',
			shortcut: '{Control>}b{/Control}',
			formatClass: formatStyles.bold,
		},
	] as const;

	cases.forEach(({ title, shortcut, formatClass }) =>
		test(title, async () => {
			await renderRichEditorInDOM({
				value: 'The quick brown fox jumps over the lazy dog',
			});

			const editor = page.getByRole('textbox');
			await editor.click();

			const selectionText = 'quick brown fox';

			// Apply formatting
			await act(async () => {
				selectText(editor.element(), selectionText);
				await userEvent.keyboard(shortcut);
			});
			expect(editor.getByText(selectionText)).toHaveStyle(formatClass);

			// Remove formatting
			await act(async () => {
				selectText(editor.element(), selectionText);
			});
			await userEvent.keyboard(shortcut);
			expect(editor.getByText(selectionText, { exact: false })).not.toHaveStyle(
				formatClass,
			);
		}),
	);
});
