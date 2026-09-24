import { act } from 'react';
import { page, userEvent } from 'vitest/browser';

import { renderRichEditorInDOM } from '../utils/renderEditorInDOM';
import { selectContent, setCursorPosition } from '../utils/utils';

const moveSelection = async (direction: 'up' | 'down') => {
	await act(async () => {
		await userEvent.keyboard(
			direction === 'up' ? '{Alt>}{ArrowUp}{/Alt}' : '{Alt>}{ArrowDown}{/Alt}',
		);
	});
};

test('Moves a paragraph up with Alt+ArrowUp', async () => {
	await renderRichEditorInDOM({
		value: 'First paragraph\n\nSecond paragraph\n\nThird paragraph',
	});

	const editor = page.getByRole('textbox');
	const paragraphs = editor.getByRole('paragraph');

	expect(paragraphs).toHaveLength(3);
	expect(paragraphs.nth(0)).toHaveTextContent('First paragraph');
	expect(paragraphs.nth(1)).toHaveTextContent('Second paragraph');
	expect(paragraphs.nth(2)).toHaveTextContent('Third paragraph');

	await act(async () => {
		await paragraphs.nth(1).click();
		setCursorPosition(paragraphs.nth(1).element(), 0);
	});
	await moveSelection('up');

	const paragraphsAfterMove = editor.getByRole('paragraph');
	expect(paragraphsAfterMove).toHaveLength(3);
	expect(paragraphsAfterMove.nth(0)).toHaveTextContent('Second paragraph');
	expect(paragraphsAfterMove.nth(1)).toHaveTextContent('First paragraph');
	expect(paragraphsAfterMove.nth(2)).toHaveTextContent('Third paragraph');
});

test('Moves a paragraph down with Alt+ArrowDown', async () => {
	await renderRichEditorInDOM({
		value: 'First paragraph\n\nSecond paragraph\n\nThird paragraph',
	});

	const editor = page.getByRole('textbox');
	const paragraphs = editor.getByRole('paragraph');

	await act(async () => {
		await paragraphs.nth(1).click();
		setCursorPosition(paragraphs.nth(1).element(), 0);
	});
	await moveSelection('down');

	const paragraphsAfterMove = editor.getByRole('paragraph');
	expect(paragraphsAfterMove).toHaveLength(3);
	expect(paragraphsAfterMove.nth(0)).toHaveTextContent('First paragraph');
	expect(paragraphsAfterMove.nth(1)).toHaveTextContent('Third paragraph');
	expect(paragraphsAfterMove.nth(2)).toHaveTextContent('Second paragraph');
});

test('Moves a contiguous paragraph selection down and back up', async () => {
	await renderRichEditorInDOM({
		value: 'Green cup\n\nRed cup\n\nBlack cup',
	});

	const editor = page.getByRole('textbox');

	await act(async () => {
		selectContent(editor.element() as HTMLElement, 'Green cup', 'Red cup');
	});
	await moveSelection('down');

	const paragraphsAfterDown = editor.getByRole('paragraph');
	expect(paragraphsAfterDown).toHaveLength(3);
	expect(paragraphsAfterDown.nth(0)).toHaveTextContent('Black cup');
	expect(paragraphsAfterDown.nth(1)).toHaveTextContent('Green cup');
	expect(paragraphsAfterDown.nth(2)).toHaveTextContent('Red cup');

	await act(async () => {
		selectContent(editor.element() as HTMLElement, 'Green cup', 'Red cup');
	});
	await moveSelection('up');

	const paragraphsAfterUp = editor.getByRole('paragraph');
	expect(paragraphsAfterUp).toHaveLength(3);
	expect(paragraphsAfterUp.nth(0)).toHaveTextContent('Green cup');
	expect(paragraphsAfterUp.nth(1)).toHaveTextContent('Red cup');
	expect(paragraphsAfterUp.nth(2)).toHaveTextContent('Black cup');
});

test('Does not move paragraphs beyond document boundaries', async () => {
	await renderRichEditorInDOM({
		value: 'First paragraph\n\nLast paragraph',
	});

	const editor = page.getByRole('textbox');
	const paragraphs = editor.getByRole('paragraph');

	await act(async () => {
		await paragraphs.nth(0).click();
		setCursorPosition(paragraphs.nth(0).element(), 0);
	});
	await moveSelection('up');

	await act(async () => {
		await editor.getByRole('paragraph').nth(1).click();
		setCursorPosition(editor.getByRole('paragraph').nth(1).element(), 0);
	});
	await moveSelection('down');

	const paragraphsAfterMoves = editor.getByRole('paragraph');
	expect(paragraphsAfterMoves).toHaveLength(2);
	expect(paragraphsAfterMoves.nth(0)).toHaveTextContent('First paragraph');
	expect(paragraphsAfterMoves.nth(1)).toHaveTextContent('Last paragraph');
});

test.todo('Moves a whole list with Alt+ArrowUp', async () => {
	await renderRichEditorInDOM({
		value: 'Before list\n\n- First item\n- Second item\n\nAfter list',
	});

	const editor = page.getByRole('textbox');
	const list = editor.getByRole('list');

	await act(async () => {
		selectContent(editor.element() as HTMLElement, 'First item', 'Second item');
	});
	await moveSelection('up');

	const blocks = editor.element().children;
	expect(blocks).toHaveLength(3);
	expect(blocks[0]).toHaveRole('list');
	expect(blocks[1]).toHaveRole('paragraph');
	expect(blocks[1]).toHaveTextContent('Before list');
	expect(blocks[2]).toHaveTextContent('After list');
	expect(list).toHaveTextContent('First item');
	expect(list).toHaveTextContent('Second item');
	expect(list.getByRole('listitem')).toHaveLength(2);
});

test.todo('Moves a list item with Alt+ArrowDown', async () => {
	await renderRichEditorInDOM({
		value: '- First item\n- Second item\n- Third item',
	});

	const editor = page.getByRole('textbox');
	const items = editor.getByRole('listitem');

	await act(async () => {
		await items.nth(1).click();
		setCursorPosition(items.nth(1).element(), 0);
	});
	await moveSelection('down');

	const itemsAfterMove = editor.getByRole('listitem');
	expect(editor.getByRole('list')).toHaveLength(1);
	expect(itemsAfterMove).toHaveLength(3);
	expect(itemsAfterMove.nth(0)).toHaveTextContent('First item');
	expect(itemsAfterMove.nth(1)).toHaveTextContent('Third item');
	expect(itemsAfterMove.nth(2)).toHaveTextContent('Second item');
});
