import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderRichEditor } from '../utils/renderRichEditor';
import { selectContent, setCursorPosition } from '../utils/utils';

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

test('Converts a list to paragraphs', async () => {
	const richEditor = await renderRichEditor({
		value: `- First item 
- Second item
- Third item`,
	});

	const editor = screen.getByRole('textbox');
	expect(within(editor).getAllByRole('list')).toHaveLength(1);
	expect(within(editor).getAllByRole('listitem')).toHaveLength(3);

	// Select the list and convert it to plain text
	selectContent(editor, 'First item', 'Third item');
	await richEditor.insert({ type: 'list', data: { type: 'unordered' } });

	expect(within(editor).queryAllByRole('list')).toHaveLength(0);
	expect(within(editor).queryAllByRole('listitem')).toHaveLength(0);

	const paragraphs = within(editor).getAllByRole('paragraph');
	expect(paragraphs).toHaveLength(3);
	expect(paragraphs[0]).toHaveTextContent('First item');
	expect(paragraphs[1]).toHaveTextContent('Second item');
	expect(paragraphs[2]).toHaveTextContent('Third item');
});

test('Converts list with nested item to paragraphs', async () => {
	const richEditor = await renderRichEditor({
		value: `- First item
    - Second item
- Third item`,
	});

	const editor = screen.getByRole('textbox');
	expect(within(editor).getAllByRole('list')).toHaveLength(2);
	expect(within(editor).getAllByRole('listitem')).toHaveLength(3);

	// Select the list and convert it to plain text
	selectContent(editor, 'First item', 'Third item');
	await richEditor.insert({ type: 'list', data: { type: 'unordered' } });

	expect(within(editor).queryAllByRole('list')).toHaveLength(0);

	const paragraphs = within(editor).getAllByRole('paragraph');
	expect(paragraphs).toHaveLength(3);
	expect(paragraphs[0]).toHaveTextContent('First item');
	expect(paragraphs[1]).toHaveTextContent('Second item');
	expect(paragraphs[2]).toHaveTextContent('Third item');
});

test('Converts a mixed list to paragraphs', async () => {
	const richEditor = await renderRichEditor({
		value: `- First item
	- [ ] Second item
- Third item`,
	});

	const editor = screen.getByRole('textbox');
	expect(within(editor).getAllByRole('list')).toHaveLength(2);
	expect(within(editor).getAllByRole('listitem')).toHaveLength(2);
	expect(within(editor).getAllByRole('checkbox')).toHaveLength(1);

	// Select the list and convert it to an unordered list
	selectContent(editor, 'First item', 'Third item');
	await richEditor.insert({ type: 'list', data: { type: 'unordered' } });

	// The first conversion of the mixed list should unify it into a single list type
	expect(within(editor).getAllByRole('listitem')).toHaveLength(3);
	expect(within(editor).queryAllByRole('checkbox')).toHaveLength(0);

	// The second conversion should convert the list to plain text
	selectContent(editor, 'First item', 'Third item');
	await richEditor.insert({ type: 'list', data: { type: 'unordered' } });

	expect(within(editor).queryAllByRole('list')).toHaveLength(0);

	const paragraphs = within(editor).getAllByRole('paragraph');
	expect(paragraphs).toHaveLength(3);
	expect(paragraphs[0]).toHaveTextContent('First item');
	expect(paragraphs[1]).toHaveTextContent('Second item');
	expect(paragraphs[2]).toHaveTextContent('Third item');
});

test('Converts selected paragraphs to a list', async () => {
	const richEditor = await renderRichEditor({
		value: `First separate text \n\n Second item \n\n Third item`,
	});
	const editor = screen.getByRole('textbox');
	expect(within(editor).getAllByRole('paragraph')).toHaveLength(3);
	expect(within(editor).queryAllByRole('list')).toHaveLength(0);

	// Select only two paragraphs
	selectContent(editor, 'Second item', 'Third item');
	await richEditor.insert({ type: 'list', data: { type: 'unordered' } });

	const list = within(editor).getByRole('list');
	const items = within(list).getAllByRole('listitem');
	expect(items).toHaveLength(2);
	expect(items[0]).toHaveTextContent('Second item');
	expect(items[1]).toHaveTextContent('Third item');

	// The first paragraph remains a plain paragraph, untouched by the conversion
	const paragraphs = within(editor).queryAllByRole('paragraph');
	expect(paragraphs).toHaveLength(1);
	expect(paragraphs[0]).toHaveTextContent('First separate text');
	expect(list).not.toContainElement(paragraphs[0]);
});

test('Converts paragraphs to a list and back to paragraphs', async () => {
	// `1 \n 2` is a single paragraph with a soft line break
	const richEditor = await renderRichEditor({
		value: `1 \n 2 \n\n 3`,
	});

	const editor = screen.getByRole('textbox');
	expect(within(editor).getAllByRole('paragraph')).toHaveLength(2);
	expect(within(editor).queryAllByRole('list')).toHaveLength(0);

	// Convert text to a list
	selectContent(editor, '1 2', '3');
	await richEditor.insert({ type: 'list', data: { type: 'unordered' } });

	expect(within(editor).getAllByRole('list')).toHaveLength(1);
	const items = within(editor).getAllByRole('listitem');
	expect(items).toHaveLength(2);
	expect(items[0]).toHaveTextContent('1 2');
	expect(items[1]).toHaveTextContent('3');

	// Convert the list back to plain text
	selectContent(editor, '1 2', '3');
	await richEditor.insert({ type: 'list', data: { type: 'unordered' } });

	expect(within(editor).queryAllByRole('list')).toHaveLength(0);
	const paragraphs = within(editor).getAllByRole('paragraph');
	expect(paragraphs).toHaveLength(2);
	expect(paragraphs[0]).toHaveTextContent('1 2');
	expect(paragraphs[1]).toHaveTextContent('3');
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
