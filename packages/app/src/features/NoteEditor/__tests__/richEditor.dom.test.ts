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
	await user.click(screen.getByRole('textbox'));
	await user.keyboard('Some text');

	expect(screen.queryByText('Some text')).not.toBeInTheDocument();
});

test('Formatting text in one editor does not affect the other editor', async () => {
	const editorA = await renderRichEditor({ value: 'Big text' });
	const editorB = await renderRichEditor({ value: 'Small text' });

	const [editorBoxA, editorBoxB] = screen.getAllByRole('textbox');

	// initial state
	expect(within(editorBoxA).queryByRole('emphasis')).not.toBeInTheDocument();
	expect(within(editorBoxA).queryByRole('paragraph')).toHaveTextContent('Big text');

	expect(within(editorBoxB).queryByRole('emphasis')).not.toBeInTheDocument();
	expect(within(editorBoxB).queryByRole('paragraph')).toHaveTextContent('Small text');

	// apply italic in editorA
	selectContent(editorBoxA, 'Big text');
	await editorA.format('italic');

	expect(within(editorBoxA).getByRole('emphasis')).toHaveTextContent('Big text');
	expect(within(editorBoxB).queryByRole('emphasis')).not.toBeInTheDocument();

	// apply strikethrough in editorB
	selectContent(editorBoxB, 'Small text');
	await editorB.format('strikethrough');

	expect(within(editorBoxB).getByRole('deletion')).toHaveTextContent('Small text');
	expect(within(editorBoxB).queryByRole('emphasis')).not.toBeInTheDocument();

	expect(within(editorBoxA).getByRole('emphasis')).toHaveTextContent('Big text');
	expect(within(editorBoxA).queryByRole('deletion')).not.toBeInTheDocument();
});

test('ReadOnly editor is not editable while the other editor remains editable', async () => {
	const content = 'Same text';

	await renderRichEditor({ value: content, isReadOnly: true });
	const editorB = await renderRichEditor({ value: content });

	const [editorBoxA, editorBoxB] = screen.getAllByRole('textbox');
	expect(screen.getAllByRole('textbox')).toHaveLength(2);

	expect(editorBoxA).toHaveAttribute('contenteditable', 'false');
	expect(editorBoxB).toHaveAttribute('contenteditable', 'true');

	// editorB is editable — format must work
	selectContent(editorBoxB, content);
	await editorB.format('italic');
	expect(within(editorBoxB).getByRole('emphasis')).toHaveTextContent(content);

	// editorA must stay untouched
	expect(within(editorBoxA).queryByRole('emphasis')).not.toBeInTheDocument();
	expect(editorBoxA).toHaveAttribute('contenteditable', 'false');
});
