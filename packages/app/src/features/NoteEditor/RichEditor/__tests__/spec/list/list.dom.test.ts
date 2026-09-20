import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderRichEditor } from '../../utils/renderRichEditor';
import { selectContent, setCursorPosition } from '../../utils/utils';

test('Converts an unordered list to an ordered list', async () => {
	const richEditor = await renderRichEditor({
		value: `- First item
  - Nested item
- Second item`,
	});
	const editor = screen.getByRole('textbox');

	expect(editor.children[0].tagName).toBe('UL');
	expect(editor.children[0].children).toHaveLength(2);

	// Select text and convert to ordered list
	selectContent(editor, 'First item');
	await richEditor.insert({ type: 'list', data: { type: 'ordered' } });

	expect(editor.children[0].tagName).toBe('OL');

	const listItems = editor.children[0].children;
	expect(listItems).toHaveLength(2);

	// First item has text and nested list
	const firstItemChildren = listItems[0].children;
	expect(firstItemChildren).toHaveLength(2);
	expect(listItems[0]).toHaveTextContent('First item');

	const nestedListChildren = firstItemChildren[1].children;
	expect(nestedListChildren).toHaveLength(1);
	expect(nestedListChildren[0]).toHaveTextContent('Nested item');

	expect(listItems[1].children).toHaveLength(1);
	expect(listItems[1]).toHaveTextContent('Second item');
});

test('Pressing Enter adds a new item to the list', async () => {
	const user = userEvent.setup();
	await renderRichEditor({ value: '- First item' });
	const editor = screen.getByRole('textbox');

	const initialChildren = editor.children;
	expect(initialChildren).toHaveLength(1);
	expect(initialChildren[0]).toHaveRole('list');
	expect(initialChildren[0].children).toHaveLength(1);

	const [firstItem] = within(editor).getAllByRole('listitem');
	expect(firstItem).toHaveTextContent('First item');

	// Place cursor and press Enter
	await user.click(firstItem);
	setCursorPosition(firstItem, 'First item'.length);
	await user.keyboard('{Enter}');

	// Editor contains only one list with two items
	const editorChildren = editor.children;
	expect(editorChildren).toHaveLength(1);
	expect(editorChildren[0]).toHaveRole('list');

	const items = editorChildren[0].children;
	expect(items).toHaveLength(2);
	expect(items[0]).toHaveTextContent('First item');
	expect(items[1]).toHaveTextContent('');
});

test('Pressing Enter on an empty last list item exits the list', async () => {
	const user = userEvent.setup();
	await renderRichEditor({ value: '- First item' });
	const editor = screen.getByRole('textbox');

	const initialChildren = editor.children;
	expect(initialChildren).toHaveLength(1);
	expect(initialChildren[0]).toHaveRole('list');
	expect(initialChildren[0].children).toHaveLength(1);

	expect(within(editor).getAllByRole('listitem')).toHaveLength(1);
	expect(within(editor).queryByRole('paragraph')).not.toBeInTheDocument();

	// Set cursor and press Enter
	const firstItem = within(editor).getByRole('listitem');
	await user.click(firstItem);
	setCursorPosition(firstItem, 'First item'.length);
	await user.keyboard('{Enter}');

	expect(within(editor).getAllByRole('listitem')).toHaveLength(2);
	expect(within(editor).queryByRole('paragraph')).not.toBeInTheDocument();

	await user.keyboard('{Enter}');

	// A new empty paragraph is created
	expect(within(editor).getByRole('paragraph')).toHaveTextContent('');
	expect(within(editor).getAllByRole('listitem')).toHaveLength(1);

	// Editor contains only list with one items and one paragraph
	const editorChildren = editor.children;
	expect(editorChildren).toHaveLength(2);
	expect(editorChildren[0]).toHaveRole('list');
	expect(editorChildren[0].children).toHaveLength(1);
	expect(editorChildren[1]).toHaveRole('paragraph');
});

describe('Rendering', () => {
	test('Renders a checklist with checked and unchecked items', async () => {
		await renderRichEditor({
			value: `- [x] First item
  - [ ] Nested item
	- [x] Deep nested item
- [ ] Second item`,
		});

		const checkboxes = within(screen.getByRole('textbox')).getAllByRole('checkbox');
		const [firstItem, nestedItem, deepNestedItem, secondItem] = checkboxes;
		expect(checkboxes).toHaveLength(4);

		// First item contains nested list
		expect(firstItem).toHaveTextContent('First item');
		expect(firstItem).toBeChecked();

		const [firstItemNestedList] = within(firstItem).getAllByRole('list');
		expect(firstItemNestedList).toContainElement(nestedItem);

		// Nested item contains deep nested list
		expect(nestedItem).toHaveTextContent('Nested item');
		expect(nestedItem).not.toBeChecked();

		const nestedItemList = within(nestedItem).getByRole('list');
		expect(nestedItemList).toContainElement(deepNestedItem);

		// Deep nested item
		expect(deepNestedItem).toHaveTextContent('Deep nested item');
		expect(deepNestedItem).toBeChecked();

		// Second item
		expect(secondItem).toHaveTextContent('Second item');
		expect(secondItem).not.toBeChecked();
	});

	test('Renders a mixed list with regular and checkbox items correctly', async () => {
		await renderRichEditor({
			value: `- [x] First item
  - Nested simple item
- [ ] Second item`,
		});

		const checkboxes = screen.getAllByRole('checkbox');
		expect(checkboxes).toHaveLength(2);
		const [first, second] = checkboxes;

		expect(first).toHaveTextContent('First item');
		expect(first).toBeChecked();

		expect(second).toHaveTextContent('Second item');
		expect(second).not.toBeChecked();

		// Nested item - regular, not checkbox
		const nestedList = within(first).getByRole('list');
		const nestedItem = within(nestedList).getByRole('listitem');

		expect(nestedItem).toHaveTextContent('Nested simple item');
		expect(within(nestedItem).queryByRole('checkbox')).toBeNull();
	});
});
