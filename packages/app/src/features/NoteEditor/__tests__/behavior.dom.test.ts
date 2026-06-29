import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderRichEditor } from './utils/renderRichEditor';
import { selectContent } from './utils/utils';

test('Editor updates when value changes', async () => {
	const editor = await renderRichEditor({ value: `# Big text` });

	expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Big text');

	// Run component rerender with new value
	await editor.rerender({ value: `### Not so big text` });

	expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
		'Not so big text',
	);

	// The old header was removed
	expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
});

test('Editor is not editable in readonly mode', async () => {
	const user = userEvent.setup();
	await renderRichEditor({
		value: '# Hello',
		isReadOnly: true,
	});

	expect(screen.getByRole('textbox')).toHaveAttribute('contenteditable', 'false');

	// Cannot enter text
	await user.click(screen.getByRole('heading'));
	await user.keyboard('Some text');

	expect(screen.getByRole('textbox')).toHaveTextContent('Hello');
	expect(screen.getByRole('textbox')).not.toHaveTextContent('Some text');
});

test('Formatting text in one editor does not affect the other editor', async () => {
	const editorA = await renderRichEditor({ value: 'Big text' });
	const editorB = await renderRichEditor({ value: 'Small text' });

	const textBoxes = screen.getAllByRole('textbox');
	expect(textBoxes).toHaveLength(2);

	// initial state
	expect(within(textBoxes[0]).queryByRole('paragraph')).toHaveTextContent('Big text');
	expect(within(textBoxes[1]).queryByRole('paragraph')).toHaveTextContent('Small text');

	// apply italic in editorA
	selectContent(textBoxes[0], 'Big text');
	await editorA.format('italic');

	expect(within(textBoxes[0]).getByRole('emphasis')).toHaveTextContent('Big text');
	expect(within(textBoxes[1]).queryByRole('emphasis')).not.toBeInTheDocument();

	// apply strikethrough in editorB
	selectContent(textBoxes[1], 'Small text');
	await editorB.format('strikethrough');

	expect(within(textBoxes[1]).getByRole('deletion')).toHaveTextContent('Small text');
	expect(within(textBoxes[1]).queryByRole('emphasis')).not.toBeInTheDocument();

	expect(within(textBoxes[0]).getByRole('emphasis')).toHaveTextContent('Big text');
	expect(within(textBoxes[0]).queryByRole('deletion')).not.toBeInTheDocument();
});

test('ReadOnly editor is not editable while the other editor remains editable', async () => {
	const user = userEvent.setup();
	await renderRichEditor({ value: 'Editable text' });
	await renderRichEditor({ value: 'ReadOnly text', isReadOnly: true });

	const textBoxes = screen.getAllByRole('textbox');
	expect(textBoxes).toHaveLength(2);

	expect(textBoxes[0]).toHaveAttribute('contenteditable', 'true');
	expect(textBoxes[1]).toHaveAttribute('contenteditable', 'false');

	// editorA is editable — editing works
	await user.click(within(textBoxes[0]).getByText('Editable text'));
	await user.keyboard('New text ');

	expect(textBoxes[0]).toHaveTextContent('New text Editable text');

	// editorB is readOnly — editing must be ignored
	await user.click(within(textBoxes[1]).getByText('ReadOnly text'));
	await user.keyboard('Some text');

	expect(textBoxes[1]).toHaveTextContent('ReadOnly text');
	expect(textBoxes[1]).not.toHaveTextContent('Some text');
	expect(textBoxes[1]).toHaveAttribute('contenteditable', 'false');
});
