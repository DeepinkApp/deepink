import { act } from 'react';
import { page, userEvent } from 'vitest/browser';

import { renderRichEditorInDOM } from '../utils/renderEditorInDOM';
import { selectContent } from '../utils/utils';

test('one list item may be nested', async () => {
	const onChanged = vi.fn();

	await renderRichEditorInDOM({
		value: '- [ ] 1\n- [ ] 2\n- [ ] 3',
		onChanged,
	});

	const editor = page.getByRole('textbox');
	expect(editor.getByRole('checkbox')).toHaveLength(3);

	// Nest item 2 that is initially a root-level list item
	await act(async () => {
		const listItem = editor.getByText('2', { exact: true });
		await listItem.click();
		await userEvent.keyboard('{Tab}');
	});

	await expect
		.poll(() => onChanged)
		.toHaveBeenLastCalledWith('- [ ] 1\n  - [ ] 2\n- [ ] 3\n');
});

test('list items may be deeply nested via keyboard shortcuts', async () => {
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
	await expect
		.poll(() => onChanged)
		.toHaveBeenLastCalledWith('- [ ] 1\n- [ ] 2\n  - [ ] 3\n- [ ] 4\n- [ ] 5\n');

	// Nest item 2
	await act(async () => {
		const listItem = editor.getByText('2', { exact: true });
		await listItem.click();
		await userEvent.keyboard('[ControlLeft>][BracketRight][/ControlLeft]');
	});

	// Wait for changes
	await expect
		.poll(() => onChanged)
		.toHaveBeenLastCalledWith('- [ ] 1\n  - [ ] 2\n    - [ ] 3\n- [ ] 4\n- [ ] 5\n');
});

test('item nesting can be decreased and empty list will be removed', async () => {
	const onChanged = vi.fn();

	await renderRichEditorInDOM({
		value: '- [ ] 1\n  - [ ] 2\n    - [ ] 3\n  - [ ] 4\n- [ ] 5\n',
		onChanged,
	});

	const editor = page.getByRole('textbox');
	expect(editor.getByRole('list')).toHaveLength(3);
	expect(editor.getByRole('checkbox')).toHaveLength(5);

	// Outdent item 3
	await act(async () => {
		const listItem = editor.getByText('3', { exact: true });
		await listItem.click();
		await userEvent.keyboard('[ControlLeft>][BracketLeft][/ControlLeft]');
	});

	expect(editor.getByRole('list')).toHaveLength(2);
	expect(editor.getByRole('checkbox')).toHaveLength(5);
	expect(editor.element()).toMatchSnapshot('The deepest nested item is moved');

	// Check for serialized markdown
	await expect
		.poll(() => onChanged)
		.toHaveBeenLastCalledWith('- [ ] 1\n  - [ ] 2\n  - [ ] 3\n  - [ ] 4\n- [ ] 5\n');

	// Outdent selected list
	await act(async () => {
		const listItem = editor.getByText('3', { exact: true });
		await listItem.click();
		selectContent(editor.getByRole('list').nth(1).element() as HTMLElement, '2', '4');

		await userEvent.keyboard('[ControlLeft>][BracketLeft][/ControlLeft]');
	});

	expect(editor.getByRole('list')).toHaveLength(1);
	expect(editor.getByRole('checkbox')).toHaveLength(5);
	expect(editor.element()).toMatchSnapshot('Flat list');

	// Check for serialized markdown
	await expect
		.poll(() => onChanged)
		.toHaveBeenLastCalledWith('- [ ] 1\n- [ ] 2\n- [ ] 3\n- [ ] 4\n- [ ] 5\n');
});

export const unjoinedLists = `
- foo
- bar
- baz


- [ ] 1
- [ ] 2
- [ ] 3
`.trim();

describe('Regressions', () => {
	test('a regular list and a checklist separated by blank lines remain separate', async () => {
		await renderRichEditorInDOM({ value: unjoinedLists });

		expect(page.getByRole('list').all()).toHaveLength(2);
	});

	test('nested items stay nested when a regular list is followed by a checklist', async () => {
		const value = `
- foo
  - bar
- baz

- [ ] 1
  - [ ] 2
    - [ ] 3
- [ ] 4
- [ ] 5
`.trim();

		await renderRichEditorInDOM({ value });

		const editor = page.getByRole('textbox');
		expect(editor.element().querySelectorAll(':scope > ul')).toHaveLength(2);
		expect(editor.getByRole('list').all()).toHaveLength(5);
		expect(editor.getByRole('checkbox')).toHaveLength(5);
	});

	test('blank-separated sibling items of the same kind remain one list', async () => {
		await renderRichEditorInDOM({ value: '- foo\n\n- bar' });

		expect(page.getByRole('list').all()).toHaveLength(1);
	});
});
