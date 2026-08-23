import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderRichEditor } from '../utils/renderRichEditor';
import { setCursorPosition } from '../utils/utils';

const setupEditor = async (value: string) => {
	const user = userEvent.setup();
	await renderRichEditor({ value });
	const editor = screen.getByRole('textbox');

	return { user, editor };
};

describe('Increase nesting level list items via keyboard', () => {
	const cases: {
		title: string;
		shortcut: string;
	}[] = [
		{ title: 'Tab', shortcut: '{Tab}' },
		{
			title: 'Ctrl+]',
			shortcut: '{Control>}]{/Control}',
		},
	];

	const initialValue = `- First item
- Second item
- Third item`;

	describe.each(cases)('Using $title', ({ shortcut }) => {
		test('keeps the first list item at the top level', async () => {
			const user = userEvent.setup();
			await renderRichEditor({ value: `- One item` });

			const editor = screen.getByRole('textbox');
			expect(within(editor).getAllByRole('list')).toHaveLength(1);

			const items = within(editor).getAllByRole('listitem');
			expect(items).toHaveLength(1);

			await user.click(items[0]);
			setCursorPosition(items[0], 0);
			await user.keyboard(shortcut);

			// structure must stay exactly the same: still one list, one item
			expect(within(editor).getAllByRole('list')).toHaveLength(1);

			const itemsAfterUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterUpdate).toHaveLength(1);
			expect(itemsAfterUpdate[0]).toHaveTextContent('One item');
		});

		test('nests item one level deeper', async () => {
			const { editor, user } = await setupEditor(initialValue);

			// Initial state
			expect(within(editor).getAllByRole('list')).toHaveLength(1);
			const items = within(editor).getAllByRole('listitem');
			expect(items).toHaveLength(3);

			await user.click(items[1]);
			setCursorPosition(items[1], 0);
			await user.keyboard(shortcut);

			expect(within(editor).getAllByRole('list')).toHaveLength(2);

			const itemsAfterUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterUpdate).toHaveLength(3);
			expect(itemsAfterUpdate[0]).toContainElement(itemsAfterUpdate[1]);
			expect(itemsAfterUpdate[1]).toHaveTextContent('Second item');
		});

		test('pressing shortcut twice does not nest further than one level deep', async () => {
			const { editor, user } = await setupEditor(initialValue);

			// Initial state
			expect(within(editor).getAllByRole('list')).toHaveLength(1);
			const items = within(editor).getAllByRole('listitem');
			expect(items).toHaveLength(3);

			await user.click(items[1]);
			setCursorPosition(items[1], 0);
			await user.keyboard(shortcut);

			expect(within(editor).getAllByRole('list')).toHaveLength(2);

			const itemsAfterUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterUpdate).toHaveLength(3);
			expect(itemsAfterUpdate[0]).toContainElement(itemsAfterUpdate[1]);

			// Second Tab does not further increase the nesting level
			await user.click(itemsAfterUpdate[1]);
			setCursorPosition(itemsAfterUpdate[1], 0);
			await user.keyboard(shortcut);

			// The structure must stay unchanged, the nesting level is still two
			expect(within(editor).getAllByRole('list')).toHaveLength(2);

			const itemsAfterSecondUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterSecondUpdate).toHaveLength(3);
			expect(itemsAfterSecondUpdate[0]).toContainElement(itemsAfterSecondUpdate[1]);
			expect(itemsAfterSecondUpdate[1]).toHaveTextContent('Second item');
		});

		test('allows nesting an item deeper than its siblings', async () => {
			const { editor, user } = await setupEditor(`- First item
	- Nested item
- Second item`);

			// Initial state
			expect(within(editor).getAllByRole('list')).toHaveLength(2);
			const items = within(editor).getAllByRole('listitem');
			expect(items).toHaveLength(3);
			expect(items[0]).toContainElement(items[1]);

			// Nest third item under the first item
			await user.click(items[2]);
			setCursorPosition(items[2], 0);
			await user.keyboard(shortcut);

			expect(within(editor).getAllByRole('list')).toHaveLength(2);
			const itemsAfterUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterUpdate).toHaveLength(3);
			expect(itemsAfterUpdate[0]).toContainElement(itemsAfterUpdate[2]);

			// Nest third item one level deeper
			await user.click(itemsAfterUpdate[2]);
			setCursorPosition(itemsAfterUpdate[2], 0);
			await user.keyboard(shortcut);

			expect(within(editor).getAllByRole('list')).toHaveLength(3);
			const itemsAfterSecondUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterSecondUpdate).toHaveLength(3);
			expect(itemsAfterSecondUpdate[1]).toContainElement(itemsAfterSecondUpdate[2]);

			// Further nesting has no effect
			await user.click(itemsAfterSecondUpdate[2]);
			setCursorPosition(itemsAfterSecondUpdate[2], 0);
			await user.keyboard(shortcut);

			expect(within(editor).getAllByRole('list')).toHaveLength(3);
			const itemsAfterThirdUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterThirdUpdate).toHaveLength(3);
			expect(itemsAfterThirdUpdate[1]).toContainElement(itemsAfterThirdUpdate[2]);
			expect(itemsAfterThirdUpdate[2]).toHaveTextContent('Second item');
		});
	});
});

describe('Decrease nesting level list items via keyboard', () => {
	const cases: {
		title: string;
		shortcut: string;
	}[] = [
		{ title: 'Tab', shortcut: '{Shift>}{Tab}{/Shift}' },
		{
			title: 'Ctrl+]',
			shortcut: '{Control>}[[{/Control}',
		},
	];

	const initialValue = `- First item
	- Nested item
- Second item`;

	describe.each(cases)('Using $title', ({ shortcut }) => {
		test('keeps a top-level item at the top level', async () => {
			const user = userEvent.setup();
			await renderRichEditor({ value: `- One item` });

			const editor = screen.getByRole('textbox');
			expect(within(editor).getAllByRole('list')).toHaveLength(1);

			const items = within(editor).getAllByRole('listitem');
			expect(items).toHaveLength(1);

			await user.click(items[0]);
			setCursorPosition(items[0], 0);
			await user.keyboard(shortcut);

			// structure must stay exactly the same: still one list, one item
			expect(within(editor).getAllByRole('list')).toHaveLength(1);
			const itemsAfterUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterUpdate).toHaveLength(1);
			expect(itemsAfterUpdate[0]).toHaveTextContent('One item');
		});

		test('unnests item one level up', async () => {
			const { editor, user } = await setupEditor(initialValue);

			// Initial state
			expect(within(editor).getAllByRole('list')).toHaveLength(2);
			const items = within(editor).getAllByRole('listitem');
			expect(items).toHaveLength(3);
			expect(items[0]).toContainElement(items[1]);

			// Unnest the nested item to the top level
			await user.click(items[1]);
			setCursorPosition(items[1], 0);
			await user.keyboard(shortcut);

			// There should be one flat list without nesting
			expect(within(editor).getAllByRole('list')).toHaveLength(1);
			const itemsAfterUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterUpdate).toHaveLength(3);
			expect(itemsAfterUpdate[0]).not.toContainElement(itemsAfterUpdate[1]);
			expect(itemsAfterUpdate[1]).toHaveTextContent('Nested item');
		});

		test('pressing shortcut twice does not unnest further than the top level', async () => {
			const { editor, user } = await setupEditor(initialValue);

			// Initial state
			expect(within(editor).getAllByRole('list')).toHaveLength(2);
			const items = within(editor).getAllByRole('listitem');
			expect(items).toHaveLength(3);
			expect(items[0]).toContainElement(items[1]);

			await user.click(items[1]);
			setCursorPosition(items[1], 0);
			await user.keyboard(shortcut);

			expect(within(editor).getAllByRole('list')).toHaveLength(1);
			const itemsAfterUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterUpdate).toHaveLength(3);
			expect(itemsAfterUpdate[0]).not.toContainElement(itemsAfterUpdate[1]);

			// Second shortcut press does not further decrease the nesting level
			await user.click(itemsAfterUpdate[1]);
			setCursorPosition(itemsAfterUpdate[1], 0);
			await user.keyboard(shortcut);

			// The structure must stay unchanged, still one flat list
			expect(within(editor).getAllByRole('list')).toHaveLength(1);

			const itemsAfterSecondUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterSecondUpdate).toHaveLength(3);
			expect(itemsAfterSecondUpdate[0]).not.toContainElement(
				itemsAfterSecondUpdate[1],
			);
			expect(itemsAfterSecondUpdate[1]).toHaveTextContent('Nested item');
			expect(itemsAfterSecondUpdate[2]).toHaveTextContent('Second item');
		});

		test('allows unnesting an item deeper than its siblings', async () => {
			const { editor, user } = await setupEditor(`- First item
    - Nested item
        - Second item`);

			// Initial state
			expect(within(editor).getAllByRole('list')).toHaveLength(3);
			const items = within(editor).getAllByRole('listitem');
			expect(items).toHaveLength(3);
			expect(items[1]).toContainElement(items[2]);

			// Unnest third item to the level of the nested item
			await user.click(items[2]);
			setCursorPosition(items[2], 0);
			await user.keyboard(shortcut);

			expect(within(editor).getAllByRole('list')).toHaveLength(2);
			const itemsAfterUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterUpdate).toHaveLength(3);
			expect(itemsAfterUpdate[1]).not.toContainElement(itemsAfterUpdate[2]);
			expect(itemsAfterUpdate[0]).toContainElement(itemsAfterUpdate[2]);

			// Unnest third item one level up, to the top level
			await user.click(itemsAfterUpdate[2]);
			setCursorPosition(itemsAfterUpdate[2], 0);
			await user.keyboard(shortcut);

			expect(within(editor).getAllByRole('list')).toHaveLength(2);
			const itemsAfterSecond = within(editor).getAllByRole('listitem');
			expect(itemsAfterSecond).toHaveLength(3);
			expect(itemsAfterSecond[0]).not.toContainElement(itemsAfterSecond[2]);
			expect(itemsAfterSecond[1]).not.toContainElement(itemsAfterSecond[2]);
			// First item must still contain the nested item — only the third item moved out
			expect(itemsAfterSecond[0]).toContainElement(itemsAfterSecond[1]);
		});

		test('moves nested children along when unnesting their parent', async () => {
			const { editor, user } = await setupEditor(`- First item
	- Nested item
		- Child of nested`);

			// Initial state
			expect(within(editor).getAllByRole('list')).toHaveLength(3);
			const items = within(editor).getAllByRole('listitem');
			expect(items).toHaveLength(3);
			expect(items[0]).toContainElement(items[1]);
			expect(items[1]).toContainElement(items[2]);

			// Unnest nested item — its child must move together with it
			await user.click(items[1]);
			setCursorPosition(items[1], 0);
			await user.keyboard(shortcut);

			expect(within(editor).getAllByRole('list')).toHaveLength(2);
			const itemsAfterUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterUpdate).toHaveLength(3);

			// Nested item is now a sibling of First item, not contained by it
			expect(itemsAfterUpdate[0]).not.toContainElement(itemsAfterUpdate[1]);
			expect(itemsAfterUpdate[0]).not.toContainElement(itemsAfterUpdate[2]);

			// The child stays nested under its original parent
			expect(itemsAfterUpdate[1]).toContainElement(itemsAfterUpdate[2]);
		});
	});
});

test('nesting and then unnesting an item restores the original structure', async () => {
	const { editor, user } = await setupEditor(`- First item
- Nested item`);

	// Initial state
	expect(within(editor).getAllByRole('list')).toHaveLength(1);
	const items = within(editor).getAllByRole('listitem');
	expect(items).toHaveLength(2);

	// Nest second item under the first
	await user.click(items[1]);
	setCursorPosition(items[1], 0);
	await user.keyboard('{Tab}');

	expect(within(editor).getAllByRole('list')).toHaveLength(2);
	const itemsAfterNest = within(editor).getAllByRole('listitem');
	expect(itemsAfterNest).toHaveLength(2);
	expect(itemsAfterNest[0]).toContainElement(itemsAfterNest[1]);

	// Unnest it back to the top level
	await user.click(itemsAfterNest[1]);
	setCursorPosition(itemsAfterNest[1], 0);
	await user.keyboard('{Shift>}{Tab}{/Shift}');

	expect(within(editor).getAllByRole('list')).toHaveLength(1);
	const itemsAfterUnnest = within(editor).getAllByRole('listitem');
	expect(itemsAfterUnnest).toHaveLength(2);
	expect(itemsAfterUnnest[0]).not.toContainElement(itemsAfterUnnest[1]);
	expect(itemsAfterUnnest[0]).toHaveTextContent('First item');
	expect(itemsAfterUnnest[1]).toHaveTextContent('Nested item');
});
