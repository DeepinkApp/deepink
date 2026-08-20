import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderRichEditor } from '../utils/renderRichEditor';
import { setCursorPosition } from '../utils/utils';

describe('Nests list items via keyboard', () => {
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

	const setupEditor = async (value: string) => {
		const user = userEvent.setup();
		await renderRichEditor({ value });
		const editor = screen.getByRole('textbox');

		return { user, editor };
	};

	const initialList = `- First item
- Nested item
- Second item`;

	describe.each(cases)('Using $title', ({ shortcut }) => {
		test('keeps the first list item at the top level', async () => {
			const user = userEvent.setup();
			await renderRichEditor({
				value: `- One item`,
			});

			const editor = screen.getByRole('textbox');
			expect(within(editor).getAllByRole('list')).toHaveLength(1);

			const listItems = within(editor).getAllByRole('listitem');
			expect(listItems).toHaveLength(1);

			await user.click(listItems[0]);
			setCursorPosition(listItems[0], 0);
			await user.keyboard(shortcut);

			// structure must stay exactly the same: still one list, one item
			expect(within(editor).getAllByRole('list')).toHaveLength(1);

			const listItemsAfter = within(editor).getAllByRole('listitem');
			expect(listItemsAfter).toHaveLength(1);
			expect(listItemsAfter[0]).toHaveTextContent('One item');
		});

		test('nests item one level deeper', async () => {
			const { editor, user } = await setupEditor(initialList);

			// Initial state
			expect(within(editor).getAllByRole('list')).toHaveLength(1);
			const initialListItems = within(editor).getAllByRole('listitem');
			expect(initialListItems).toHaveLength(3);

			await user.click(initialListItems[1]);
			setCursorPosition(initialListItems[1], 0);
			await user.keyboard(shortcut);

			expect(within(editor).getAllByRole('list')).toHaveLength(2);

			const listsAfterUpdate = within(editor).getAllByRole('listitem');
			expect(listsAfterUpdate).toHaveLength(3);
			expect(listsAfterUpdate[0]).toContainElement(listsAfterUpdate[1]);
		});

		test('pressing shortcut twice does not nest further than one level deep', async () => {
			const { editor, user } = await setupEditor(initialList);

			// Initial state
			expect(within(editor).getAllByRole('list')).toHaveLength(1);
			const initialListItems = within(editor).getAllByRole('listitem');
			expect(initialListItems).toHaveLength(3);

			await user.click(initialListItems[1]);
			setCursorPosition(initialListItems[1], 0);
			await user.keyboard(shortcut);

			expect(within(editor).getAllByRole('list')).toHaveLength(2);

			const listsAfterUpdate = within(editor).getAllByRole('listitem');
			expect(listsAfterUpdate).toHaveLength(3);
			expect(listsAfterUpdate[0]).toContainElement(listsAfterUpdate[1]);

			// Second Tab does not further increase the nesting level
			await user.click(listsAfterUpdate[1]);
			setCursorPosition(listsAfterUpdate[1], 0);
			await user.keyboard(shortcut);

			// The structure must stay unchanged, the nesting level is still two
			expect(within(editor).getAllByRole('list')).toHaveLength(2);

			const listsAfterSecondTab = within(editor).getAllByRole('listitem');
			expect(listsAfterSecondTab).toHaveLength(3);
			expect(listsAfterSecondTab[0]).toContainElement(listsAfterSecondTab[1]);
		});
	});
});
