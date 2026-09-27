import { act } from 'react';
import { page, userEvent } from 'vitest/browser';

import { renderRichEditorInDOM } from '../../utils/renderEditorInDOM';
import { selectContent, setCursorPosition } from '../../utils/utils';

import { expectMarkdown, moveSelection } from './utils';

test('Alt+ArrowUp moves a selected list as one block', async () => {
	const onChanged = vi.fn();

	await renderRichEditorInDOM({
		value: [
			'Before list',
			'',
			'- First item',
			'- Second item',
			'',
			'After list',
		].join('\n'),
		onChanged,
	});

	await act(async () => {
		await page.getByRole('textbox').click();
		selectContent(
			page.getByRole('textbox').element() as HTMLElement,
			'First item',
			'Second item',
		);
	});
	await moveSelection('up');

	await expectMarkdown(onChanged, [
		'- First item',
		'- Second item',
		'',
		'Before list',
		'',
		'After list',
	]);
});

test('Alt+ArrowDown moves a list item after its next sibling', async () => {
	const onChanged = vi.fn();

	await renderRichEditorInDOM({
		value: ['- First item', '- Second item', '- Third item'].join('\n'),
		onChanged,
	});

	const secondItem = page.getByText('Second item', { exact: true });
	await act(async () => {
		await secondItem.click();
	});
	await moveSelection('down');

	await expectMarkdown(onChanged, ['- First item', '- Third item', '- Second item']);
});

test('Alt+ArrowUp moves a nested item into the previous parent’s list', async () => {
	const onChanged = vi.fn();

	await renderRichEditorInDOM({
		value: [
			'- Parent one',
			'- Parent two',
			'  - Nested one',
			'  - Nested two',
			'- Parent three',
		].join('\n'),
		onChanged,
	});

	const nestedOne = page.getByText('Nested one', { exact: true });
	await act(async () => {
		await nestedOne.click();
	});
	await moveSelection('up');

	await expectMarkdown(onChanged, [
		'- Parent one',
		'  - Nested one',
		'- Parent two',
		'  - Nested two',
		'- Parent three',
	]);
});

test('Alt+ArrowDown moves a nested item into the next parent’s list', async () => {
	const onChanged = vi.fn();

	await renderRichEditorInDOM({
		value: [
			'- Parent one',
			'  - Nested one',
			'  - Nested two',
			'- Parent two',
			'- Parent three',
		].join('\n'),
		onChanged,
	});

	const nestedTwo = page.getByText('Nested two', { exact: true });
	await act(async () => {
		await nestedTwo.click();
	});
	await moveSelection('down');

	await expectMarkdown(onChanged, [
		'- Parent one',
		'  - Nested one',
		'- Parent two',
		'  - Nested two',
		'- Parent three',
	]);
});

test('Alt+ArrowUp on the first list item moves the whole list up', async () => {
	const onChanged = vi.fn();

	await renderRichEditorInDOM({
		value: [
			'Before list',
			'',
			'- First item',
			'- Second item',
			'',
			'After list',
		].join('\n'),
		onChanged,
	});

	const firstItem = page.getByText('First item', { exact: true });
	await act(async () => {
		await firstItem.click();
	});
	await moveSelection('up');

	await expectMarkdown(onChanged, [
		'- First item',
		'- Second item',
		'',
		'Before list',
		'',
		'After list',
	]);
});

test('Alt+ArrowDown on the last list item moves the whole list down', async () => {
	const onChanged = vi.fn();

	await renderRichEditorInDOM({
		value: [
			'Before list',
			'',
			'- First item',
			'- Second item',
			'',
			'After list',
		].join('\n'),
		onChanged,
	});

	const lastItem = page.getByText('Second item', { exact: true });
	await act(async () => {
		await lastItem.click();
	});
	await moveSelection('down');

	await expectMarkdown(onChanged, [
		'Before list',
		'',
		'After list',
		'',
		'- First item',
		'- Second item',
	]);
});

test('Alt+ArrowUp appends a nested item to the previous parent’s existing list', async () => {
	const onChanged = vi.fn();

	await renderRichEditorInDOM({
		value: [
			'- Parent one',
			'  - Existing child',
			'- Parent two',
			'  - Moving child',
		].join('\n'),
		onChanged,
	});

	const movingChild = page.getByText('Moving child', { exact: true });
	await act(async () => {
		await movingChild.click();
	});
	await moveSelection('up');

	await expectMarkdown(onChanged, [
		'- Parent one',
		'  - Existing child',
		'  - Moving child',
		'- Parent two',
	]);
});

test('Alt+ArrowDown prepends a nested item to the next parent’s existing list', async () => {
	const onChanged = vi.fn();

	await renderRichEditorInDOM({
		value: [
			'- Parent one',
			'  - Moving child',
			'- Parent two',
			'  - Existing child',
		].join('\n'),
		onChanged,
	});

	const movingChild = page.getByText('Moving child', { exact: true });
	await act(async () => {
		await movingChild.click();
	});
	await moveSelection('down');

	await expectMarkdown(onChanged, [
		'- Parent one',
		'- Parent two',
		'  - Moving child',
		'  - Existing child',
	]);
});

test('Alt+ArrowUp moves the outer list when a nested item has no previous parent sibling', async () => {
	const onChanged = vi.fn();

	await renderRichEditorInDOM({
		value: [
			'Before list',
			'',
			'- Parent',
			'  - Nested one',
			'  - Nested two',
			'- Another item',
			'',
			'After list',
		].join('\n'),
		onChanged,
	});

	const nestedOne = page.getByText('Nested one', { exact: true });
	await act(async () => {
		await nestedOne.click();
	});
	await moveSelection('up');

	await expectMarkdown(onChanged, [
		'- Parent',
		'  - Nested one',
		'  - Nested two',
		'- Another item',
		'',
		'Before list',
		'',
		'After list',
	]);
});

test('Alt+ArrowDown creates a nested list under the next parent at a deeper level', async () => {
	const onChanged = vi.fn();

	await renderRichEditorInDOM({
		value: [
			'- Root one',
			'  - Parent one',
			'    - Deep one',
			'    - Deep two',
			'  - Parent two',
			'- Root two',
		].join('\n'),
		onChanged,
	});

	const deepTwo = page.getByText('Deep two', { exact: true });
	await act(async () => {
		await deepTwo.click();
	});
	await moveSelection('down');

	await expectMarkdown(onChanged, [
		'- Root one',
		'  - Parent one',
		'    - Deep one',
		'  - Parent two',
		'    - Deep two',
		'- Root two',
	]);
});

test('Alt+ArrowDown removes empty source lists when moving the last deep child', async () => {
	const onChanged = vi.fn();

	await renderRichEditorInDOM({
		value: ['- Root one', '  - Parent one', '    - Deep only', '- Root two'].join(
			'\n',
		),
		onChanged,
	});

	const deepOnly = page.getByText('Deep only', { exact: true });
	await act(async () => {
		await deepOnly.click();
	});
	await moveSelection('down');

	await expectMarkdown(onChanged, [
		'- Root one',
		'  - Parent one',
		'- Root two',
		'  - Deep only',
	]);
});

test('Alt+ArrowUp moves a deep item into the previous sibling’s existing list', async () => {
	const onChanged = vi.fn();

	await renderRichEditorInDOM({
		value: [
			'- Root',
			'  - Group',
			'    - Parent A',
			'      - Existing child',
			'    - Parent B',
			'      - Moving child',
		].join('\n'),
		onChanged,
	});

	const movingChild = page.getByText('Moving child', { exact: true });
	await act(async () => {
		await movingChild.click();
	});
	await moveSelection('up');

	await expectMarkdown(onChanged, [
		'- Root',
		'  - Group',
		'    - Parent A',
		'      - Existing child',
		'      - Moving child',
		'    - Parent B',
	]);
});

test('Alt+ArrowDown moves a deep item and its children into the next sibling’s list', async () => {
	const onChanged = vi.fn();

	await renderRichEditorInDOM({
		value: [
			'- Root',
			'  - Group',
			'    - Parent A',
			'      - Moving child',
			'        - Grandchild',
			'    - Parent B',
			'      - Existing child',
		].join('\n'),
		onChanged,
	});

	const movingChild = page.getByText('Moving child', { exact: true });
	await act(async () => {
		await movingChild.click();
	});
	await moveSelection('down');

	await expectMarkdown(onChanged, [
		'- Root',
		'  - Group',
		'    - Parent A',
		'    - Parent B',
		'      - Moving child',
		'        - Grandchild',
		'      - Existing child',
	]);
});

test('Alt+ArrowDown moves selected nested items together', async () => {
	const onChanged = vi.fn();

	await renderRichEditorInDOM({
		value: [
			'- Root',
			'  - Parent',
			'    - First',
			'    - Second',
			'    - Third',
		].join('\n'),
		onChanged,
	});

	await act(async () => {
		selectContent(
			page.getByRole('textbox').element() as HTMLElement,
			'First',
			'Second',
		);
	});
	await moveSelection('down');

	await expectMarkdown(onChanged, [
		'- Root',
		'  - Parent',
		'    - Third',
		'    - First',
		'    - Second',
	]);
});

test('Alt+ArrowDown keeps an unordered item separate from an ordered sibling list', async () => {
	const onChanged = vi.fn();

	await renderRichEditorInDOM({
		value: [
			'- Root',
			'  - Parent A',
			'    - Moving child',
			'  - Parent B',
			'    1. Existing ordered child',
		].join('\n'),
		onChanged,
	});

	const movingChild = page.getByText('Moving child', { exact: true });
	await act(async () => {
		await movingChild.click();
	});
	await moveSelection('down');

	await expectMarkdown(onChanged, [
		'- Root',
		'  - Parent A',
		'  - Parent B',
		'    1. Existing ordered child',
		'    - Moving child',
	]);
});

test('Alt+ArrowUp keeps the cursor in a moved list item', async () => {
	await renderRichEditorInDOM({
		value: ['- foo', '- bar', '- baz'].join('\n'),
	});

	const bar = page.getByText('bar', { exact: true });
	await act(async () => {
		await bar.click();
		setCursorPosition(bar.element(), 3);
	});
	await moveSelection('up');

	await act(async () => {
		await userEvent.keyboard('X');
	});

	expect(page.getByRole('listitem').nth(0)).toHaveTextContent('barX');
	expect(page.getByRole('listitem').nth(1)).toHaveTextContent('foo');
});
