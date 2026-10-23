import { act } from 'react';
import { page } from 'vitest/browser';

import { renderRichEditorInDOM } from './utils/renderEditorInDOM';
import { textFormatClasses } from './utils/richEditorFixtures';
import { selectContent } from './utils/utils';

test('Formatting text in one editor does not affect the other editor', async () => {
	const editorA = await renderRichEditorInDOM({ value: 'Big text' });
	const editorB = await renderRichEditorInDOM({ value: 'Small text' });

	const editorContainers = page.getByRole('textbox');
	expect(editorContainers).toHaveLength(2);
	const editorALocator = editorContainers.nth(0);
	const editorBLocator = editorContainers.nth(1);

	// initial state
	expect(editorALocator).toHaveTextContent('Big text');
	expect(editorBLocator).toHaveTextContent('Small text');

	// apply italic in editorA
	await editorALocator.click();
	await act(async () => selectContent(editorALocator.element(), 'Big text'));
	await editorA.openContextMenu(editorALocator.getByText('Big text'), [
		'Format',
		'Italic',
	]);
	expect(editorALocator.getByRole('emphasis')).toHaveTextContent('Big text');
	expect(editorBLocator.getByRole('emphasis')).not.toBeInTheDocument();

	// apply strikethrough in editorB
	await editorBLocator.click();
	await act(async () => selectContent(editorBLocator.element(), 'Small text'));
	await editorB.openContextMenu(editorBLocator.getByText('Small text'), [
		'Format',
		'Strikethrough',
	]);
	expect(editorBLocator.getByText('Small text')).toHaveClass(
		textFormatClasses.strikethrough,
	);
	expect(editorBLocator.getByText('Small text')).not.toHaveClass(
		textFormatClasses.italic,
	);

	// No changes in editorA
	expect(editorALocator.getByText('Big text')).toHaveClass(textFormatClasses.italic);
	expect(editorALocator.getByText('Big text')).not.toHaveClass(
		textFormatClasses.strikethrough,
	);
});
