import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderRichEditor } from '../../utils/renderRichEditor';
import { selectContent, setCursorPosition } from '../../utils/utils';

const shortcuts = [
	{
		title: 'Tab',
		increase: '{Tab}',
		decrease: '{Shift>}{Tab}{/Shift}',
	},
	{
		title: 'Ctrl+]/[',
		increase: '{Control>}]{/Control}',
		// `[` is a special character in userEvent syntax, so it must be doubled
		decrease: '{Control>}[[{/Control}',
	},
];

const setupEditor = async (value: string) => {
	const user = userEvent.setup();
	await renderRichEditor({ value });
	const editor = screen.getByRole('textbox');

	const applyShortcut = async (item: HTMLElement, shortcut: string) => {
		await user.click(item);
		setCursorPosition(item, 0);
		await user.keyboard(shortcut);
	};

	const applyShortcutToSelection = async (
		anchorItem: HTMLElement,
		range: { from: string; to: string },
		shortcut: string,
	) => {
		await user.click(anchorItem);
		selectContent(within(editor).getAllByRole('list')[0], range.from, range.to);
		await user.keyboard(shortcut);
	};

	return { user, editor, applyShortcut, applyShortcutToSelection };
};

describe('Increase nesting level list items via keyboard', () => {
	const cases = shortcuts.map(({ title, increase }) => ({
		title,
		shortcut: increase,
	}));

	const initialValue = `- First item
- Second item
- Third item`;

	describe.each(cases)('Using $title', ({ shortcut }) => {
		test('nests item one level deeper', async () => {
			const { editor, applyShortcut } = await setupEditor(initialValue);

			expect(within(editor).getAllByRole('list')).toHaveLength(1);
			const items = within(editor).getAllByRole('listitem');
			expect(items).toHaveLength(3);

			await applyShortcut(items[1], shortcut);

			expect(within(editor).getAllByRole('list')).toHaveLength(2);
			const itemsAfterUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterUpdate).toHaveLength(3);

			expect(itemsAfterUpdate[0]).toContainElement(itemsAfterUpdate[1]);
			expect(itemsAfterUpdate[1]).toHaveTextContent('Second item');
		});

		test('pressing shortcut twice does not nest further than one level deep', async () => {
			const { editor, applyShortcut } = await setupEditor(initialValue);

			expect(within(editor).getAllByRole('list')).toHaveLength(1);
			const items = within(editor).getAllByRole('listitem');
			expect(items).toHaveLength(3);

			await applyShortcut(items[1], shortcut);

			expect(within(editor).getAllByRole('list')).toHaveLength(2);
			const itemsAfterUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterUpdate).toHaveLength(3);

			expect(itemsAfterUpdate[0]).toContainElement(itemsAfterUpdate[1]);

			// Second shortcut does not further increase the nesting level
			await applyShortcut(itemsAfterUpdate[1], shortcut);

			// The structure must stay unchanged, the nesting level is still two
			expect(within(editor).getAllByRole('list')).toHaveLength(2);
			const itemsAfterSecondUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterSecondUpdate).toHaveLength(3);

			expect(itemsAfterSecondUpdate[0]).toContainElement(itemsAfterSecondUpdate[1]);
			expect(itemsAfterSecondUpdate[1]).toHaveTextContent('Second item');
		});

		test('allows nesting an item deeper than its siblings', async () => {
			const { editor, applyShortcut } = await setupEditor(`- First item
    - Second item
- Third item`);

			expect(within(editor).getAllByRole('list')).toHaveLength(2);
			const items = within(editor).getAllByRole('listitem');
			expect(items).toHaveLength(3);
			expect(items[0]).toContainElement(items[1]);
			expect(items[0]).not.toContainElement(items[2]);

			// Nest third item under the first item
			await applyShortcut(items[2], shortcut);

			expect(within(editor).getAllByRole('list')).toHaveLength(2);
			const itemsAfterUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterUpdate).toHaveLength(3);
			expect(itemsAfterUpdate[0]).toContainElement(itemsAfterUpdate[2]);
			expect(itemsAfterUpdate[1]).not.toContainElement(itemsAfterUpdate[2]);

			// Nest third item one level deeper
			await applyShortcut(itemsAfterUpdate[2], shortcut);

			expect(within(editor).getAllByRole('list')).toHaveLength(3);
			const itemsAfterSecondUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterSecondUpdate).toHaveLength(3);
			expect(itemsAfterSecondUpdate[1]).toContainElement(itemsAfterSecondUpdate[2]);

			// Further nesting of the third element has no effect
			await applyShortcut(itemsAfterSecondUpdate[2], shortcut);

			expect(within(editor).getAllByRole('list')).toHaveLength(3);
			const itemsAfterThirdUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterThirdUpdate).toHaveLength(3);

			expect(itemsAfterThirdUpdate[1]).toContainElement(itemsAfterThirdUpdate[2]);
			expect(itemsAfterThirdUpdate[2]).toHaveTextContent('Third item');
		});

		test('nests multiple selected items', async () => {
			const { editor, applyShortcutToSelection } = await setupEditor(initialValue);

			expect(within(editor).getAllByRole('list')).toHaveLength(1);
			const items = within(editor).getAllByRole('listitem');
			expect(items).toHaveLength(3);

			// Select second and third items, then nest them together
			await applyShortcutToSelection(
				items[1],
				{ from: 'Second item', to: 'Third item' },
				shortcut,
			);

			// Both selected items become one nested sub-list under First item
			expect(within(editor).getAllByRole('list')).toHaveLength(2);
			const itemsAfterUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterUpdate).toHaveLength(3);

			expect(itemsAfterUpdate[0]).toContainElement(itemsAfterUpdate[1]);
			expect(itemsAfterUpdate[0]).toContainElement(itemsAfterUpdate[2]);
			expect(itemsAfterUpdate[1]).not.toContainElement(itemsAfterUpdate[2]);

			// Select the same two items again and increase their nesting
			await applyShortcutToSelection(
				itemsAfterUpdate[1],
				{ from: 'Second item', to: 'Third item' },
				shortcut,
			);

			// Nesting increasing only for third item
			expect(within(editor).getAllByRole('list')).toHaveLength(3);
			const itemsAfterSecondUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterSecondUpdate).toHaveLength(3);

			expect(itemsAfterSecondUpdate[0]).toContainElement(itemsAfterSecondUpdate[1]);
			expect(itemsAfterSecondUpdate[1]).toContainElement(itemsAfterSecondUpdate[2]);

			expect(itemsAfterSecondUpdate[1]).toHaveTextContent('Second item');
			expect(itemsAfterSecondUpdate[2]).toHaveTextContent('Third item');
		});
	});
});

describe('Decrease nesting level list items via keyboard', () => {
	const cases = shortcuts.map(({ title, decrease }) => ({
		title,
		shortcut: decrease,
	}));

	const initialValue = `- First item
    - Second item
- Third item`;

	const deeplyNestedValue = `- First item
    - Second item
        - Third item`;

	describe.each(cases)('Using $title', ({ shortcut }) => {
		test('unnests item one level up', async () => {
			const { editor, applyShortcut } = await setupEditor(initialValue);

			expect(within(editor).getAllByRole('list')).toHaveLength(2);
			const items = within(editor).getAllByRole('listitem');
			expect(items).toHaveLength(3);
			expect(items[0]).toContainElement(items[1]);

			// Unnest the nested item to the top level
			await applyShortcut(items[1], shortcut);

			// One flat list without nesting
			expect(within(editor).getAllByRole('list')).toHaveLength(1);
			const itemsAfterUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterUpdate).toHaveLength(3);

			expect(itemsAfterUpdate[0]).not.toContainElement(itemsAfterUpdate[1]);
			expect(itemsAfterUpdate[1]).toHaveTextContent('Second item');
		});

		test('pressing shortcut twice does not unnest further than the top level', async () => {
			const { editor, applyShortcut } = await setupEditor(initialValue);

			expect(within(editor).getAllByRole('list')).toHaveLength(2);
			const items = within(editor).getAllByRole('listitem');
			expect(items).toHaveLength(3);

			expect(items[0]).toContainElement(items[1]);

			await applyShortcut(items[1], shortcut);

			expect(within(editor).getAllByRole('list')).toHaveLength(1);
			const itemsAfterUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterUpdate).toHaveLength(3);

			expect(itemsAfterUpdate[0]).not.toContainElement(itemsAfterUpdate[1]);

			// Second shortcut does not further decrease the nesting level
			await applyShortcut(itemsAfterUpdate[1], shortcut);

			// The structure is unchanged, one flat list
			expect(within(editor).getAllByRole('list')).toHaveLength(1);
			const itemsAfterSecondUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterSecondUpdate).toHaveLength(3);

			expect(itemsAfterSecondUpdate[0]).not.toContainElement(
				itemsAfterSecondUpdate[1],
			);
			expect(itemsAfterSecondUpdate[1]).toHaveTextContent('Second item');
		});

		test('allows unnesting an item deeper than its siblings', async () => {
			const { editor, applyShortcut } = await setupEditor(deeplyNestedValue);

			expect(within(editor).getAllByRole('list')).toHaveLength(3);
			const items = within(editor).getAllByRole('listitem');
			expect(items).toHaveLength(3);

			expect(items[1]).toContainElement(items[2]);

			// Decrease nesting for third item
			await applyShortcut(items[2], shortcut);

			expect(within(editor).getAllByRole('list')).toHaveLength(2);
			const itemsAfterUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterUpdate).toHaveLength(3);

			expect(itemsAfterUpdate[1]).not.toContainElement(itemsAfterUpdate[2]);
			expect(itemsAfterUpdate[0]).toContainElement(itemsAfterUpdate[2]);

			// Move the third item to the top level
			await applyShortcut(itemsAfterUpdate[2], shortcut);

			expect(within(editor).getAllByRole('list')).toHaveLength(2);
			const itemsAfterSecondUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterSecondUpdate).toHaveLength(3);

			expect(itemsAfterSecondUpdate[0]).not.toContainElement(
				itemsAfterSecondUpdate[2],
			);
			expect(itemsAfterSecondUpdate[1]).not.toContainElement(
				itemsAfterSecondUpdate[2],
			);

			// Second item is still nested under the first
			expect(itemsAfterSecondUpdate[0]).toContainElement(itemsAfterSecondUpdate[1]);

			expect(itemsAfterSecondUpdate[2]).toHaveTextContent('Third item');
		});

		test('moves nested children along when unnesting their parent', async () => {
			const { editor, applyShortcut } = await setupEditor(deeplyNestedValue);

			expect(within(editor).getAllByRole('list')).toHaveLength(3);
			const items = within(editor).getAllByRole('listitem');
			expect(items).toHaveLength(3);

			expect(items[0]).toContainElement(items[1]);
			expect(items[1]).toContainElement(items[2]);

			// Decrease nesting for second item, its child moves with them
			await applyShortcut(items[1], shortcut);

			expect(within(editor).getAllByRole('list')).toHaveLength(2);
			const itemsAfterUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterUpdate).toHaveLength(3);

			expect(itemsAfterUpdate[1]).toContainElement(itemsAfterUpdate[2]);
			expect(itemsAfterUpdate[0]).not.toContainElement(itemsAfterUpdate[1]);
			expect(itemsAfterUpdate[0]).not.toContainElement(itemsAfterUpdate[2]);

			expect(itemsAfterUpdate[1]).toHaveTextContent('Second item');
			expect(itemsAfterUpdate[2]).toHaveTextContent('Third item');
		});

		test('unnests multiple selected items across multiple levels', async () => {
			const { editor, applyShortcutToSelection } =
				await setupEditor(deeplyNestedValue);

			expect(within(editor).getAllByRole('list')).toHaveLength(3);
			const items = within(editor).getAllByRole('listitem');
			expect(items).toHaveLength(3);

			expect(items[0]).toContainElement(items[1]);
			expect(items[1]).toContainElement(items[2]);

			// Select two items and decrease their nesting
			await applyShortcutToSelection(
				items[1],
				{ from: 'Second item', to: 'Third item' },
				shortcut,
			);

			// The second item is on the same level as the first and contains the third item
			expect(within(editor).getAllByRole('list')).toHaveLength(2);
			const itemsAfterUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterUpdate).toHaveLength(3);

			expect(itemsAfterUpdate[0]).not.toContainElement(itemsAfterUpdate[1]);
			expect(itemsAfterUpdate[1]).toContainElement(itemsAfterUpdate[2]);

			// Select the same two items again and decrease their nesting
			await applyShortcutToSelection(
				itemsAfterUpdate[1],
				{ from: 'Second item', to: 'Third item' },
				shortcut,
			);

			// One flat list with no nesting
			expect(within(editor).getAllByRole('list')).toHaveLength(1);
			const itemsAfterSecondUpdate = within(editor).getAllByRole('listitem');
			expect(itemsAfterSecondUpdate).toHaveLength(3);

			expect(itemsAfterSecondUpdate[0]).not.toContainElement(
				itemsAfterSecondUpdate[1],
			);
			expect(itemsAfterSecondUpdate[1]).not.toContainElement(
				itemsAfterSecondUpdate[2],
			);

			expect(itemsAfterSecondUpdate[1]).toHaveTextContent('Second item');
			expect(itemsAfterSecondUpdate[2]).toHaveTextContent('Third item');
		});
	});
});

describe('Nesting level boundaries and round-trip', () => {
	describe.each(shortcuts)('Using $title', ({ increase, decrease }) => {
		test.each([
			['increasing', increase],
			['decreasing', decrease],
		])('%s nesting has no effect on a single top-level item', async (_, shortcut) => {
			const { editor, applyShortcut } = await setupEditor('- One item');

			expect(within(editor).getAllByRole('list')).toHaveLength(1);
			const items = within(editor).getAllByRole('listitem');
			expect(items).toHaveLength(1);

			await applyShortcut(items[0], shortcut);

			expect(within(editor).getAllByRole('list')).toHaveLength(1);
			const itemsAfter = within(editor).getAllByRole('listitem');
			expect(itemsAfter).toHaveLength(1);

			expect(itemsAfter[0]).toHaveTextContent('One item');
		});

		test('nesting and then unnesting an item restores the original structure', async () => {
			const { editor, applyShortcut } = await setupEditor(`- First item
- Nested item`);

			expect(within(editor).getAllByRole('list')).toHaveLength(1);
			const items = within(editor).getAllByRole('listitem');
			expect(items).toHaveLength(2);

			await applyShortcut(items[1], increase);

			expect(within(editor).getAllByRole('list')).toHaveLength(2);
			const itemsAfterNest = within(editor).getAllByRole('listitem');
			expect(itemsAfterNest).toHaveLength(2);

			expect(itemsAfterNest[0]).toContainElement(itemsAfterNest[1]);

			await applyShortcut(items[1], decrease);

			expect(within(editor).getAllByRole('list')).toHaveLength(1);
			const itemsAfterUnnest = within(editor).getAllByRole('listitem');
			expect(itemsAfterUnnest).toHaveLength(2);

			expect(itemsAfterUnnest[0]).not.toContainElement(itemsAfterUnnest[1]);
			expect(itemsAfterUnnest[0]).toHaveTextContent('First item');
			expect(itemsAfterUnnest[1]).toHaveTextContent('Nested item');
		});
	});
});
