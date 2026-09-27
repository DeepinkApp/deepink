import { act } from 'react';
import { page, userEvent } from 'vitest/browser';

import { renderRichEditorInDOM } from '../utils/renderEditorInDOM';

test('list items may be nested via keyboard shortcuts', async () => {
	const onChanged = vi.fn();

	await renderRichEditorInDOM({
		value: '- [ ] 1\n- [ ] 2\n- [ ] 3\n- [ ] 4\n- [ ] 5',
		onChanged,
	});

	const editor = page.getByRole('textbox');

	expect(editor.getByRole('checkbox')).toHaveLength(5);

	// Nest item 3
	await act(async () => {
		const listItem = editor.getByText('3', { exact: true });
		await listItem.click();
		await userEvent.keyboard('[ControlLeft>][BracketRight][/ControlLeft]');
	});

	// Wait for changes
	await expect.poll(() => onChanged).toHaveBeenCalledTimes(1);
	expect(onChanged).toHaveBeenLastCalledWith(
		'- [ ] 1\n- [ ] 2\n  - [ ] 3\n- [ ] 4\n- [ ] 5\n',
	);

	// Nest item 2
	await act(async () => {
		const listItem = editor.getByText('2', { exact: true });
		await listItem.click();
		await userEvent.keyboard('[ControlLeft>][BracketRight][/ControlLeft]');
	});

	// Wait for changes
	await expect.poll(() => onChanged).toHaveBeenCalledTimes(2);
	expect(onChanged).toHaveBeenLastCalledWith(
		'- [ ] 1\n  - [ ] 2\n    - [ ] 3\n- [ ] 4\n- [ ] 5\n',
	);
});
