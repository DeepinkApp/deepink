import { act } from 'react';
import { page, userEvent } from 'vitest/browser';

import { renderRichEditorInDOM } from '../../utils/renderEditorInDOM';
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
	await renderRichEditorInDOM({ value });

	const editorLocator = page.getByRole('textbox');
	const editor = page.getByRole('textbox').element();

	const applyShortcutForItem = async (item: Element, shortcut: string) => {
		await act(async () => {
			await page.elementLocator(item).click();
			setCursorPosition(item, 0);
			await userEvent.keyboard(shortcut);
		});
	};

	const applyShortcutToSelection = async (
		anchorItem: Element,
		range: { from: string; to: string },
		shortcut: string,
	) => {
		await act(async () => {
			await page.elementLocator(anchorItem).click();
			selectContent(
				editorLocator.getByRole('list').first().element(),
				range.from,
				range.to,
			);
			await userEvent.keyboard(shortcut);
		});
	};

	return { editor, editorLocator, applyShortcutForItem, applyShortcutToSelection };
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
			const { editorLocator, applyShortcutForItem } =
				await setupEditor(initialValue);
			expect(editorLocator.getByRole('list')).toHaveLength(1);

			const items = editorLocator.getByRole('listitem');
			expect(items).toHaveLength(3);

			// Nest the second item
			await applyShortcutForItem(items.nth(1).element(), shortcut);

			const itemsAfterUpdate = editorLocator.getByRole('listitem');
			expect(itemsAfterUpdate).toHaveLength(3);

			// The first item now contains the nested second item
			expect(itemsAfterUpdate.nth(0).element()).toContainElement(
				itemsAfterUpdate.nth(1).element(),
			);

			expect(itemsAfterUpdate.nth(0).element()).toHaveTextContent('First item');
			expect(itemsAfterUpdate.nth(1).element()).toHaveTextContent('Second item');
			expect(itemsAfterUpdate.nth(2).element()).toHaveTextContent('Third item');
		});

		test('pressing shortcut twice does not nest further than one level deep', async () => {
			const { editorLocator, applyShortcutForItem } =
				await setupEditor(initialValue);

			const listLocator = editorLocator.getByRole('list');

			expect(listLocator).toHaveLength(1);

			const items = editorLocator.getByRole('listitem');
			expect(items).toHaveLength(3);

			// Nest the second item
			await applyShortcutForItem(items.nth(1).element(), shortcut);

			expect(listLocator).toHaveLength(2);
			expect(items).toHaveLength(3);

			// The first item now contains the nested second item
			expect(items.nth(0).element()).toContainElement(items.nth(1).element());

			// Second shortcut does not further increase the nesting level
			await applyShortcutForItem(items.nth(1).element(), shortcut);

			// The structure must stay unchanged, the nesting level is still two
			expect(listLocator).toHaveLength(2);
			expect(items).toHaveLength(3);

			expect(items.nth(0).element()).toContainElement(items.nth(1).element());
			expect(items.nth(1).element()).toHaveTextContent('Second item');
		});

		test('allows nesting one level deeper than the previous sibling', async () => {
			const { editorLocator, applyShortcutForItem } =
				await setupEditor(`- First item
    - Second item
- Third item`);

			const listLocator = editorLocator.getByRole('list');
			expect(listLocator).toHaveLength(2);

			const items = editorLocator.getByRole('listitem');
			expect(items).toHaveLength(3);

			// The third item is at the top level
			expect(items.nth(0).element()).toContainElement(items.nth(1).element());
			expect(items.nth(0).element()).not.toContainElement(items.nth(2).element());

			// Nest third item under the first item
			await applyShortcutForItem(items.nth(2).element(), shortcut);

			expect(listLocator).toHaveLength(2);
			expect(items).toHaveLength(3);
			expect(items.nth(0).element()).toContainElement(items.nth(2).element());
			expect(items.nth(1).element()).not.toContainElement(items.nth(2).element());

			// Nest third item one level deeper
			await applyShortcutForItem(items.nth(2).element(), shortcut);

			expect(listLocator).toHaveLength(3);
			expect(items).toHaveLength(3);
			expect(items.nth(1).element()).toContainElement(items.nth(2).element());

			// Further nesting of the third element has no effect
			await applyShortcutForItem(items.nth(2).element(), shortcut);

			expect(listLocator).toHaveLength(3);
			expect(items).toHaveLength(3);

			expect(items.nth(1).element()).toContainElement(items.nth(2).element());

			expect(items.nth(0).element()).toHaveTextContent('First item');
			expect(items.nth(1).element()).toHaveTextContent('Second item');
			expect(items.nth(2).element()).toHaveTextContent('Third item');
		});

		test('nests multiple selected items together', async () => {
			const { editorLocator, applyShortcutToSelection } =
				await setupEditor(initialValue);

			const listLocator = editorLocator.getByRole('list');
			expect(listLocator).toHaveLength(1);

			const items = editorLocator.getByRole('listitem');
			expect(items).toHaveLength(3);

			// Select second and third items, then nest them together
			await applyShortcutToSelection(
				items.nth(1).element(),
				{ from: 'Second item', to: 'Third item' },
				shortcut,
			);

			// Both selected items become one nested sub-list under First item
			expect(listLocator).toHaveLength(2);
			expect(items).toHaveLength(3);

			expect(items.nth(0).element()).toContainElement(items.nth(1).element());
			expect(items.nth(0).element()).toContainElement(items.nth(2).element());
			expect(items.nth(1).element()).not.toContainElement(items.nth(2).element());
		});

		test('nesting an already-nested selection only affects the last item', async () => {
			const { editorLocator, applyShortcutToSelection } =
				await setupEditor(`- First item
    - Second item
    - Third item`);

			const listLocator = editorLocator.getByRole('list');
			expect(listLocator).toHaveLength(2);

			const items = editorLocator.getByRole('listitem');
			expect(items).toHaveLength(3);

			// Select the already-nested second and third items, and nest them again
			await applyShortcutToSelection(
				items.nth(1).element(),
				{ from: 'Second item', to: 'Third item' },
				shortcut,
			);

			// The second item is already nested, so only the third item is nested further
			expect(listLocator).toHaveLength(3);
			expect(items).toHaveLength(3);

			expect(items.nth(0).element()).toContainElement(items.nth(1).element());
			expect(items.nth(1).element()).toContainElement(items.nth(2).element());

			expect(items.nth(0).element()).toHaveTextContent('First item');
			expect(items.nth(1).element()).toHaveTextContent('Second item');
			expect(items.nth(2).element()).toHaveTextContent('Third item');
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
			const { editorLocator, applyShortcutForItem } =
				await setupEditor(initialValue);

			const listLocator = editorLocator.getByRole('list');
			expect(listLocator).toHaveLength(2);

			const items = editorLocator.getByRole('listitem');
			expect(items).toHaveLength(3);
			expect(items.nth(0).element()).toContainElement(items.nth(1).element());

			// Unnest the second item to the top level
			await applyShortcutForItem(items.nth(1).element(), shortcut);

			// One flat list without nesting
			expect(listLocator).toHaveLength(1);
			expect(items).toHaveLength(3);

			expect(items.nth(0).element()).not.toContainElement(items.nth(1).element());

			expect(items.nth(0).element()).toHaveTextContent('First item');
			expect(items.nth(1).element()).toHaveTextContent('Second item');
			expect(items.nth(2).element()).toHaveTextContent('Third item');
		});

		test('pressing shortcut twice does not unnest further than the top level', async () => {
			const { editorLocator, applyShortcutForItem } =
				await setupEditor(initialValue);

			const listLocator = editorLocator.getByRole('list');
			expect(listLocator).toHaveLength(2);

			const items = editorLocator.getByRole('listitem');
			expect(items).toHaveLength(3);

			expect(items.nth(0).element()).toContainElement(items.nth(1).element());

			// Unnest second item
			await applyShortcutForItem(items.nth(1).element(), shortcut);

			expect(listLocator).toHaveLength(1);
			expect(items).toHaveLength(3);

			expect(items.nth(0).element()).not.toContainElement(items.nth(1).element());

			// Second shortcut does not further decrease the nesting level
			await applyShortcutForItem(items.nth(1).element(), shortcut);

			// The structure is unchanged, one flat list
			expect(listLocator).toHaveLength(1);
			expect(items).toHaveLength(3);

			expect(items.nth(0).element()).not.toContainElement(items.nth(1).element());

			expect(items.nth(0).element()).toHaveTextContent('First item');
			expect(items.nth(1).element()).toHaveTextContent('Second item');
			expect(items.nth(2).element()).toHaveTextContent('Third item');
		});

		test('allows unnesting down to the top level', async () => {
			const { editorLocator, applyShortcutForItem } =
				await setupEditor(deeplyNestedValue);

			const listLocator = editorLocator.getByRole('list');
			expect(listLocator).toHaveLength(3);

			const items = editorLocator.getByRole('listitem');
			expect(items).toHaveLength(3);

			expect(items.nth(1).element()).toContainElement(items.nth(2).element());

			// Unnest third item from under Second item
			await applyShortcutForItem(items.nth(2).element(), shortcut);

			expect(listLocator).toHaveLength(2);
			expect(items).toHaveLength(3);

			expect(items.nth(1).element()).not.toContainElement(items.nth(2).element());
			expect(items.nth(0).element()).toContainElement(items.nth(2).element());

			//Unnest third item to the top level
			await applyShortcutForItem(items.nth(2).element(), shortcut);

			expect(listLocator).toHaveLength(2);
			expect(items).toHaveLength(3);

			// Second item is still nested under the first
			expect(items.nth(0).element()).toContainElement(items.nth(1).element());

			expect(items.nth(0).element()).not.toContainElement(items.nth(2).element());
			expect(items.nth(1).element()).not.toContainElement(items.nth(2).element());

			expect(items.nth(0).element()).toHaveTextContent('First item');
			expect(items.nth(1).element()).toHaveTextContent('Second item');
			expect(items.nth(2).element()).toHaveTextContent('Third item');
		});

		test('unnesting an item keeps its own children nested under it', async () => {
			const { editorLocator, applyShortcutForItem } =
				await setupEditor(deeplyNestedValue);

			const listLocator = editorLocator.getByRole('list');
			expect(listLocator).toHaveLength(3);

			const items = editorLocator.getByRole('listitem');
			expect(items).toHaveLength(3);

			expect(items.nth(0).element()).toContainElement(items.nth(1).element());
			expect(items.nth(1).element()).toContainElement(items.nth(2).element());

			// Decrease nesting for second item, its child moves with them
			await applyShortcutForItem(items.nth(1).element(), shortcut);

			expect(listLocator).toHaveLength(2);
			expect(items).toHaveLength(3);

			expect(items.nth(1).element()).toContainElement(items.nth(2).element());
			expect(items.nth(0).element()).not.toContainElement(items.nth(1).element());
			expect(items.nth(0).element()).not.toContainElement(items.nth(2).element());

			expect(items.nth(0).element()).toHaveTextContent('First item');
			expect(items.nth(1).element()).toHaveTextContent('Second item');
			expect(items.nth(2).element()).toHaveTextContent('Third item');
		});

		test('unnests multiple selected items', async () => {
			const { editorLocator, applyShortcutToSelection } =
				await setupEditor(deeplyNestedValue);

			const listLocator = editorLocator.getByRole('list');
			expect(listLocator).toHaveLength(3);

			const items = editorLocator.getByRole('listitem');
			expect(items).toHaveLength(3);

			expect(items.nth(0).element()).toContainElement(items.nth(1).element());
			expect(items.nth(1).element()).toContainElement(items.nth(2).element());

			// Select two items and decrease their nesting
			await applyShortcutToSelection(
				items.nth(1).element(),
				{ from: 'Second item', to: 'Third item' },
				shortcut,
			);

			// The second item is on the same level as the first and contains the third item
			expect(listLocator).toHaveLength(2);
			expect(items).toHaveLength(3);

			expect(items.nth(0).element()).not.toContainElement(items.nth(1).element());
			expect(items.nth(1).element()).toContainElement(items.nth(2).element());

			// Select the same two items again and decrease nesting
			await applyShortcutToSelection(
				items.nth(1).element(),
				{ from: 'Second item', to: 'Third item' },
				shortcut,
			);

			// One flat list with no nesting
			expect(listLocator).toHaveLength(1);
			expect(items).toHaveLength(3);

			expect(items.nth(0).element()).not.toContainElement(items.nth(1).element());
			expect(items.nth(1).element()).not.toContainElement(items.nth(2).element());

			expect(items.nth(0).element()).toHaveTextContent('First item');
			expect(items.nth(1).element()).toHaveTextContent('Second item');
			expect(items.nth(2).element()).toHaveTextContent('Third item');
		});
	});
});

describe('Nesting level boundaries and round-trip', () => {
	describe.each(shortcuts)('Using $title', ({ increase, decrease }) => {
		test.each([
			['increasing', increase],
			['decreasing', decrease],
		])('%s nesting has no effect on the only item in a list', async (_, shortcut) => {
			const { editorLocator, applyShortcutForItem } =
				await setupEditor('- One item');

			const listLocator = editorLocator.getByRole('list');
			expect(listLocator).toHaveLength(1);

			const items = editorLocator.getByRole('listitem');
			expect(items).toHaveLength(1);

			await applyShortcutForItem(items.nth(0).element(), shortcut);

			expect(listLocator).toHaveLength(1);
			expect(items).toHaveLength(1);

			expect(items.nth(0).element()).toHaveTextContent('One item');
		});

		test('nesting and then unnesting an item restores the original structure', async () => {
			const { editorLocator, applyShortcutForItem } =
				await setupEditor(`- First item
- Nested item`);

			const listLocator = editorLocator.getByRole('list');
			expect(listLocator).toHaveLength(1);

			const items = editorLocator.getByRole('listitem');
			expect(items).toHaveLength(2);

			await applyShortcutForItem(items.nth(1).element(), increase);

			expect(listLocator).toHaveLength(2);
			expect(items).toHaveLength(2);

			expect(items.nth(0).element()).toContainElement(items.nth(1).element());

			await applyShortcutForItem(items.nth(1).element(), decrease);

			expect(listLocator).toHaveLength(1);
			expect(items).toHaveLength(2);

			expect(items.nth(0).element()).not.toContainElement(items.nth(1).element());
			expect(items.nth(0).element()).toHaveTextContent('First item');
			expect(items.nth(1).element()).toHaveTextContent('Nested item');
		});
	});
});
