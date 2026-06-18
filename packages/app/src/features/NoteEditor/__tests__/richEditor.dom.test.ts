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

test('Editing one editor does not affect the other editor', async () => {
	const editorA = await renderRichEditor({ value: `# Big text` });
	const editorB = await renderRichEditor({ value: `## Small text` });

	const [editorBoxA, editorBoxB] = screen.getAllByRole('textbox');
	expect(screen.getAllByRole('textbox')).toHaveLength(2);

	// initial state
	expect(within(editorBoxA).getByRole('heading', { level: 1 })).toHaveTextContent(
		'Big text',
	);
	expect(within(editorBoxB).getByRole('heading', { level: 2 })).toHaveTextContent(
		'Small text',
	);

	// change heading level in editorA, editorB must stay untouched
	selectContent(editorBoxA, 'Big text');
	await editorA.insert({ type: 'heading', data: { level: 4 } });

	expect(within(editorBoxA).getByRole('heading', { level: 4 })).toHaveTextContent(
		'Big text',
	);
	expect(within(editorBoxB).getByRole('heading', { level: 2 })).toHaveTextContent(
		'Small text',
	);
	expect(within(editorBoxA).queryByRole('heading', { level: 2 })).toBeNull();
	expect(within(editorBoxB).queryByRole('heading', { level: 4 })).toBeNull();

	// change heading level in editorB, editorA must stay untouched
	selectContent(editorBoxB, 'Small text');
	await editorB.insert({ type: 'heading', data: { level: 3 } });

	expect(within(editorBoxA).getByRole('heading', { level: 4 })).toHaveTextContent(
		'Big text',
	);
	expect(within(editorBoxB).getByRole('heading', { level: 3 })).toHaveTextContent(
		'Small text',
	);
	expect(within(editorBoxA).queryByRole('heading', { level: 3 })).toBeNull();
	expect(within(editorBoxB).queryByRole('heading', { level: 4 })).toBeNull();
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
	await editorB.format('bold');
	expect(within(editorBoxB).getByText(content).closest('b')).toBeInTheDocument();

	// editorA must stay untouched
	expect(within(editorBoxA).getByText(content).closest('b')).not.toBeInTheDocument();
});
