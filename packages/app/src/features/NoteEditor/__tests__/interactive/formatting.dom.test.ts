import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderRichEditor } from '../utils/renderRichEditor';
import { selectContent, selectText } from '../utils/utils';

// TODO: Remove `.fails` after fixing the formatting implementation
// The assertions below describe the expected behavior and should remain unchanged
test('Applies formatting to a selected part of a text node', async () => {
	const user = userEvent.setup();
	const richEditor = await renderRichEditor({ value: 'Hello, my dear friends!' });

	const editor = screen.getByRole('textbox');
	await user.click(editor);
	selectText(editor, 'friends');

	// Apply formatting
	await richEditor.format('italic');

	// await act(async () => await user.keyboard('{Ctrl>}b{/Ctrl}'));
	// await user.keyboard('{Control>}i{/Control}');

	// expect(richEditor.container.outerHTML).toBe("")
	expect(
		screen.getAllByRole('emphasis').find((el) => within(el).queryByText('friends'))
			?.textContent,
	).toBe('friends');
	// expect(screen.getByRole('emphasis')).toHaveTextContent('Hello, my dear ');
});

test.skip('Applies formatting across multiple text blocks', async () => {
	const richEditor = await renderRichEditor({
		value: 'Hello, my dear friends! \n\n Nice to see you. \n\n How are you ?',
	});

	const editor = screen.getByRole('textbox');
	selectContent(editor, 'Hello, my dear friends!', 'How are you ?');

	// Apply formatting
	await richEditor.format('italic');

	// Each line should be wrapped in emphasis
	const formattingNodes = within(editor).getAllByRole('emphasis');
	expect(formattingNodes).toHaveLength(3);
	expect(formattingNodes[0]).toHaveTextContent('Hello, my dear friends!');
	expect(formattingNodes[1]).toHaveTextContent('Nice to see you');
	expect(formattingNodes[2]).toHaveTextContent('How are you ?');
});
