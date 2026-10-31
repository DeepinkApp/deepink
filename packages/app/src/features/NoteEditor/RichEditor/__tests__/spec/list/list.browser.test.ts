import { act } from 'react';
import { page, userEvent } from 'vitest/browser';

import { renderRichEditorInDOM } from '../../utils/renderEditorInDOM';
import { selectContent, setCursorPosition } from '../../utils/utils';

test('Converts an unordered list to an ordered list', async () => {
	const richEditor = await renderRichEditorInDOM({
		value: `- First item
  - Nested item
- Second item`,
	});
	const editor = page.getByRole('textbox');
	const list = editor.getByRole('list').nth(0);
	expect(list.element().tagName).toBe('UL');

	await act(async () => {
		await editor.click();
		selectContent(editor.element() as HTMLElement, 'First item');
	});
	await richEditor.openContextMenu(editor.getByText('First item'), [
		'Paragraph',
		'Ordered list',
	]);

	const orderedList = editor.getByRole('list').nth(0).element();
	expect(orderedList.tagName).toBe('OL');
	expect(orderedList.children).toHaveLength(2);
	expect(orderedList.children[0]).toHaveTextContent('First item');
	expect(editor.getByRole('listitem').nth(0).getByRole('list')).toHaveTextContent(
		'Nested item',
	);
	expect(orderedList.children[1]).toHaveTextContent('Second item');
});

test('Converts a list to paragraphs', async () => {
	const richEditor = await renderRichEditorInDOM({
		value: '- First item\n- Second item\n- Third item',
	});
	const editor = page.getByRole('textbox');
	expect(editor.getByRole('listitem')).toHaveLength(3);

	await act(async () => {
		await editor.click();
		selectContent(editor.element() as HTMLElement, 'First item', 'Third item');
	});
	await richEditor.openContextMenu(editor.getByRole('list'), [
		'Paragraph',
		'Unordered list',
	]);

	expect(editor.getByRole('list')).toHaveLength(0);
	const paragraphs = editor.getByRole('paragraph');
	expect(paragraphs).toHaveLength(3);
	expect(paragraphs.nth(0)).toHaveTextContent('First item');
	expect(paragraphs.nth(1)).toHaveTextContent('Second item');
	expect(paragraphs.nth(2)).toHaveTextContent('Third item');
});

test('Converts selected paragraphs to a list and preserves unselected text', async () => {
	const richEditor = await renderRichEditorInDOM({
		value: 'First separate text\n\nSecond item\n\nThird item',
	});
	const editor = page.getByRole('textbox');
	expect(editor.getByRole('paragraph')).toHaveLength(3);

	await act(async () => {
		await editor.click();
		selectContent(editor.element() as HTMLElement, 'Second item', 'Third item');
	});
	await richEditor.openContextMenu(editor.getByText('Second item'), [
		'Paragraph',
		'Unordered list',
	]);

	const items = editor.getByRole('listitem');
	expect(items).toHaveLength(2);
	expect(items.nth(0)).toHaveTextContent('Second item');
	expect(items.nth(1)).toHaveTextContent('Third item');
	expect(editor.getByRole('paragraph')).toHaveTextContent('First separate text');
});

test('Converts paragraphs to a list and back to paragraphs', async () => {
	const richEditor = await renderRichEditorInDOM({ value: '1 2\n\n3' });
	const editor = page.getByRole('textbox');

	await act(async () => {
		await editor.click();
		selectContent(editor.element() as HTMLElement, '1 2', '3');
	});
	await richEditor.openContextMenu(editor.getByText('1 2'), [
		'Paragraph',
		'Unordered list',
	]);
	expect(editor.getByRole('listitem')).toHaveLength(2);

	await act(async () => {
		await editor.click();
		selectContent(editor.element() as HTMLElement, '1 2', '3');
	});
	await richEditor.openContextMenu(editor.getByRole('list'), [
		'Paragraph',
		'Unordered list',
	]);

	expect(editor.getByRole('list')).toHaveLength(0);
	const paragraphs = editor.getByRole('paragraph');
	expect(paragraphs).toHaveLength(2);
	expect(paragraphs.nth(0)).toHaveTextContent('1 2');
	expect(paragraphs.nth(1)).toHaveTextContent('3');
});

test('Pressing Enter adds a new item to a list', async () => {
	await renderRichEditorInDOM({ value: '- First item' });
	const editor = page.getByRole('textbox');
	const firstItem = editor.getByRole('listitem');

	await act(async () => {
		await firstItem.click();
		setCursorPosition(firstItem.element(), 'First item'.length);
		await userEvent.keyboard('{Enter}');
	});

	const items = editor.getByRole('listitem');
	expect(items).toHaveLength(2);
	expect(items.nth(0)).toHaveTextContent('First item');
	expect(items.nth(1)).toHaveTextContent('');
});

test('Pressing Enter on an empty last list item exits the list', async () => {
	await renderRichEditorInDOM({ value: '- First item' });
	const editor = page.getByRole('textbox');
	const firstItem = editor.getByRole('listitem');

	await act(async () => {
		await firstItem.click();
		setCursorPosition(firstItem.element(), 'First item'.length);
		await userEvent.keyboard('{Enter}{Enter}');
	});

	expect(editor.getByRole('listitem')).toHaveLength(1);
	expect(editor.getByRole('paragraph')).toHaveLength(1);
	expect(editor.getByRole('paragraph')).toHaveTextContent('');
});

describe('Rendering checklists', () => {
	test('Renders checked and unchecked nested items', async () => {
		await renderRichEditorInDOM({
			value: `- [x] First item
  - [ ] Nested item
    - [x] Deep nested item
- [ ] Second item`,
		});

		const checkboxes = page.getByRole('checkbox');
		expect(checkboxes).toHaveLength(4);

		const [firstItem, nestedItem, deepNestedItem, secondItem] = checkboxes.all();
		expect(firstItem).toHaveTextContent('First item');
		expect(firstItem).toBeChecked();
		expect(firstItem.getByRole('list').first()).toContainElement(
			nestedItem.element(),
		);

		expect(nestedItem).toHaveTextContent('Nested item');
		expect(nestedItem).not.toBeChecked();
		expect(nestedItem.getByRole('list').first()).toContainElement(
			deepNestedItem.element(),
		);

		expect(deepNestedItem).toHaveTextContent('Deep nested item');
		expect(deepNestedItem).toBeChecked();

		expect(secondItem).toHaveTextContent('Second item');
		expect(secondItem).not.toBeChecked();
	});

	test('Renders a mixed list with regular and checkbox items', async () => {
		await renderRichEditorInDOM({
			value: `- [x] First item
  - Nested simple item
- [ ] Second item`,
		});

		const checkboxes = page.getByRole('checkbox');
		expect(checkboxes).toHaveLength(2);

		const [first, second] = checkboxes.all();
		expect(first).toHaveTextContent('First item');
		expect(first).toBeChecked();
		expect(second).toHaveTextContent('Second item');
		expect(second).not.toBeChecked();

		const nestedItem = first.getByRole('list').first().getByRole('listitem');
		expect(nestedItem).toHaveTextContent('Nested simple item');
		expect(nestedItem.getByRole('checkbox')).not.toBeInTheDocument();
	});
});
