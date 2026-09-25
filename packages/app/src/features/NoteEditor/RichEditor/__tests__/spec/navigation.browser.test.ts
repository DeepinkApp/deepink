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

test('Moves a whole list with Alt+ArrowUp', async () => {
	await renderRichEditorInDOM({
		value: 'Before list\n\n- First item\n- Second item\n\nAfter list',
	});

	const editor = page.getByRole('textbox');
	const list = editor.getByRole('list');

	await act(async () => {
		await list.click();
		selectContent(editor.element() as HTMLElement, 'First item', 'Second item');
	});
	await moveSelection('up');

	const blocks = editor.element().children;
	expect(blocks).toHaveLength(3);
	expect(blocks[0]).toHaveRole('list');

	expect(blocks[1]).toHaveRole('paragraph');
	expect(blocks[1]).toHaveTextContent('Before list');
	expect(blocks[2]).toHaveRole('paragraph');
	expect(blocks[2]).toHaveTextContent('After list');

	expect(list).toHaveTextContent('First item');
	expect(list).toHaveTextContent('Second item');
	expect(list.getByRole('listitem')).toHaveLength(2);
});

test('Moves a list item with Alt+ArrowDown', async () => {
	await renderRichEditorInDOM({
		value: '- First item\n- Second item\n- Third item',
	});

	const editor = page.getByRole('textbox');
	const items = editor.getByRole('listitem');

	await act(async () => {
		await items.nth(1).click();
		setCursorPosition(items.nth(1).element(), 2);
	});
	await moveSelection('down');

	const itemsAfterMove = editor.getByRole('listitem');
	expect(editor.getByRole('list')).toHaveLength(1);
	expect(itemsAfterMove).toHaveLength(3);
	expect(itemsAfterMove.nth(0)).toHaveTextContent('First item');
	expect(itemsAfterMove.nth(1)).toHaveTextContent('Third item');
	expect(itemsAfterMove.nth(2)).toHaveTextContent('Second item');
});

test('Moves the whole root list when its first item moves up', async () => {
	await renderRichEditorInDOM({
		value: 'Before list\n\n- First item\n- Second item\n\nAfter list',
	});

	const editor = page.getByRole('textbox');
	const list = editor.getByRole('list');
	const firstItem = editor.getByRole('listitem').nth(0);

	await act(async () => {
		await firstItem.click();
		setCursorPosition(firstItem.element(), 0);
	});
	await moveSelection('up');

	const blocks = editor.element().children;
	expect(blocks).toHaveLength(3);
	expect(blocks[0]).toHaveRole('list');
	expect(blocks[1]).toHaveTextContent('Before list');
	expect(blocks[2]).toHaveTextContent('After list');
	expect(list.getByRole('listitem').nth(0)).toHaveTextContent('First item');
	expect(list.getByRole('listitem').nth(1)).toHaveTextContent('Second item');
});

test('Moves the whole root list when its last item moves down', async () => {
	await renderRichEditorInDOM({
		value: 'Before list\n\n- First item\n- Second item\n\nAfter list',
	});

	const editor = page.getByRole('textbox');
	const list = editor.getByRole('list');
	const lastItem = editor.getByRole('listitem').nth(1);

	await act(async () => {
		await lastItem.click();
		setCursorPosition(lastItem.element(), 0);
	});
	await moveSelection('down');

	const blocks = editor.element().children;
	expect(blocks).toHaveLength(3);
	expect(blocks[0]).toHaveTextContent('Before list');
	expect(blocks[1]).toHaveTextContent('After list');
	expect(blocks[2]).toHaveRole('list');
	expect(list.getByRole('listitem').nth(0)).toHaveTextContent('First item');
	expect(list.getByRole('listitem').nth(1)).toHaveTextContent('Second item');
});

test('Moves an edge nested item into the previous parent item', async () => {
	await renderRichEditorInDOM({
		value: '- Parent one\n- Parent two\n  - Nested one\n  - Nested two\n- Parent three',
	});

	const editor = page.getByRole('textbox');
	const nestedItems = editor.getByRole('listitem');
	const nestedOne = nestedItems.nth(2);

	await act(async () => {
		await nestedOne.click();
		setCursorPosition(nestedOne.element(), 0);
	});
	await moveSelection('up');

	const items = editor.getByRole('listitem');
	expect(items).toHaveLength(5);
	expect(items.nth(0)).toHaveTextContent('Parent one');
	expect(items.nth(0)).toContainElement(items.nth(1).element());
	expect(items.nth(1)).toHaveTextContent('Nested one');
	expect(items.nth(2)).toHaveTextContent('Parent two');
	expect(items.nth(2)).toContainElement(items.nth(3).element());
	expect(items.nth(3)).toHaveTextContent('Nested two');
	expect(items.nth(4)).toHaveTextContent('Parent three');
});

test('Moves an edge nested item into the next parent list', async () => {
	// TODO: fix list styles to show its nesting
	await renderRichEditorInDOM({
		value: '- Parent one\n  - Nested one\n  - Nested two\n- Parent two\n- Parent three',
	});

	const editor = page.getByRole('textbox');
	const nestedTwo = editor.getByRole('listitem').filter({ hasText: /^Nested two$/ });

	await act(async () => {
		await nestedTwo.click();
		setCursorPosition(nestedTwo.element(), 0);
	});
	await moveSelection('down');

	const items = editor.getByRole('listitem');
	expect(items).toHaveLength(5);
	expect(items.nth(0)).toHaveTextContent('Parent one');
	expect(items.nth(0)).toContainElement(items.nth(1).element());
	expect(items.nth(1)).toHaveTextContent('Nested one');

	expect(items.nth(2)).toHaveTextContent('Parent two');
	expect(items.nth(2)).toContainElement(items.nth(3).element());
	expect(items.nth(3)).toHaveTextContent('Nested two');

	expect(items.nth(4)).toHaveTextContent('Parent three');
});

test('Appends an upward-moving nested item to an existing nested list', async () => {
	await renderRichEditorInDOM({
		value: '- Parent one\n  - Existing child\n- Parent two\n  - Moving child',
	});

	const editor = page.getByRole('textbox');
	const movingChild = editor.getByRole('listitem').nth(3);

	await act(async () => {
		await movingChild.click();
		setCursorPosition(movingChild.element(), 0);
	});
	await moveSelection('up');

	const nestedLists = editor.getByRole('list');
	expect(nestedLists).toHaveLength(2);
	expect(nestedLists.nth(1).getByRole('listitem')).toHaveLength(2);
	expect(nestedLists.nth(1).getByRole('listitem').nth(0)).toHaveTextContent(
		'Existing child',
	);
	expect(nestedLists.nth(1).getByRole('listitem').nth(1)).toHaveTextContent(
		'Moving child',
	);
});

test('Prepends a downward-moving nested item to an existing nested list', async () => {
	await renderRichEditorInDOM({
		value: '- Parent one\n  - Moving child\n- Parent two\n  - Existing child',
	});

	const editor = page.getByRole('textbox');
	const movingChild = editor.getByRole('listitem').nth(1);

	await act(async () => {
		await movingChild.click();
		setCursorPosition(movingChild.element(), 0);
	});
	await moveSelection('down');

	const nestedLists = editor.getByRole('list');
	expect(nestedLists).toHaveLength(2);
	expect(nestedLists.nth(1).getByRole('listitem')).toHaveLength(2);
	expect(nestedLists.nth(1).getByRole('listitem').nth(0)).toHaveTextContent(
		'Moving child',
	);
	expect(nestedLists.nth(1).getByRole('listitem').nth(1)).toHaveTextContent(
		'Existing child',
	);
});

test('Moves the outer list when an edge nested item has no parent sibling', async () => {
	await renderRichEditorInDOM({
		value: 'Before list\n\n- Parent\n  - Nested one\n  - Nested two\n- Another item\n\nAfter list',
	});

	const editor = page.getByRole('textbox');
	const nestedOne = editor.getByRole('listitem').nth(1);

	await act(async () => {
		await nestedOne.click();
		setCursorPosition(nestedOne.element(), 0);
	});
	await moveSelection('up');

	const blocks = editor.element().children;
	expect(blocks).toHaveLength(3);
	expect(blocks[0]).toHaveRole('list');
	expect(blocks[1]).toHaveTextContent('Before list');
	expect(blocks[2]).toHaveTextContent('After list');
	expect(editor.getByRole('list').first()).toHaveTextContent('Nested one');
});

test('Moves an edge item correctly at a deeper nesting level', async () => {
	await renderRichEditorInDOM({
		value: '- Root one\n  - Parent one\n    - Deep one\n    - Deep two\n  - Parent two\n- Root two',
	});

	const editor = page.getByRole('textbox');
	const deepTwo = editor.getByRole('listitem').nth(3);

	await act(async () => {
		await deepTwo.click();
		setCursorPosition(deepTwo.element(), 0);
	});
	await moveSelection('down');

	const items = editor.getByRole('listitem');
	expect(items).toHaveLength(6);
	expect(items.nth(0)).toHaveTextContent('Root one');
	expect(items.nth(1)).toHaveTextContent('Parent one');
	expect(items.nth(2)).toHaveTextContent('Deep one');
	expect(items.nth(3)).toHaveTextContent('Parent two');
	expect(items.nth(3)).toContainElement(items.nth(4).element());
	expect(items.nth(4)).toHaveTextContent('Deep two');
	expect(items.nth(5)).toHaveTextContent('Root two');
});

test('Moves a middle quote paragraph within the quote', async () => {
	await renderRichEditorInDOM({
		value: 'Before\n\n> Quote one\n>\n> Quote two\n>\n> Quote three\n\nAfter',
	});

	const editor = page.getByRole('textbox');
	const quote = editor.getByRole('blockquote');
	const paragraphs = quote.getByRole('paragraph');

	await act(async () => {
		await paragraphs.nth(1).click();
		setCursorPosition(paragraphs.nth(1).element(), 0);
	});
	await moveSelection('up');

	const paragraphsAfterMove = quote.getByRole('paragraph');
	expect(paragraphsAfterMove.nth(0)).toHaveTextContent('Quote two');
	expect(paragraphsAfterMove.nth(1)).toHaveTextContent('Quote one');
	expect(paragraphsAfterMove.nth(2)).toHaveTextContent('Quote three');
});

test('Moves the whole quote when its first paragraph moves up', async () => {
	await renderRichEditorInDOM({
		value: 'Before\n\n> Quote one\n>\n> Quote two\n>\n> Quote three\n\nAfter',
	});

	const editor = page.getByRole('textbox');
	const quote = editor.getByRole('blockquote');
	const firstParagraph = quote.getByRole('paragraph').nth(0);

	await act(async () => {
		await firstParagraph.click();
		setCursorPosition(firstParagraph.element(), 0);
	});
	await moveSelection('up');

	const blocks = editor.element().children;
	expect(blocks[0]).toHaveRole('blockquote');
	expect(blocks[1]).toHaveTextContent('Before');
	expect(blocks[2]).toHaveTextContent('After');
});

test('Moves a mixed root-level selection as an ordered group', async () => {
	await renderRichEditorInDOM({
		value: 'Before\n\n- One\n- Two\n\nBetween\n\n> Quote\n\nAfter',
	});

	const editor = page.getByRole('textbox');
	await act(async () => {
		selectContent(editor.element() as HTMLElement, 'One', 'Quote');
	});
	await moveSelection('up');

	const blocks = editor.element().children;
	expect(blocks[0]).toHaveRole('list');
	expect(blocks[1]).toHaveRole('paragraph');
	expect(blocks[1]).toHaveTextContent('Between');
	expect(blocks[2]).toHaveRole('blockquote');
	expect(blocks[3]).toHaveTextContent('Before');
	expect(blocks[4]).toHaveTextContent('After');
});

test('Keeps the cursor in a list item after moving it', async () => {
	await renderRichEditorInDOM({
		value: '- foo\n- bar\n- baz',
	});

	const editor = page.getByRole('textbox');
	const bar = editor.getByRole('listitem').nth(1);

	await act(async () => {
		await bar.click();
		setCursorPosition(bar.element(), 3);
	});
	await moveSelection('up');

	await act(async () => {
		await userEvent.keyboard('X');
	});

	expect(editor.getByRole('listitem').nth(0)).toHaveTextContent('barX');
	expect(editor.getByRole('listitem').nth(1)).toHaveTextContent('foo');
});
