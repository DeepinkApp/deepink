import { act } from 'react';
import { page, userEvent } from 'vitest/browser';

import { renderRichEditorInDOM } from '../utils/renderEditorInDOM';
import { selectContent } from '../utils/utils';

const moveSelection = async (direction: 'up' | 'down') => {
	await act(async () => {
		await userEvent.keyboard(
			direction === 'up' ? '{Alt>}{ArrowUp}{/Alt}' : '{Alt>}{ArrowDown}{/Alt}',
		);
	});
};

const expectMarkdown = async (onChanged: ReturnType<typeof vi.fn>, lines: string[]) => {
	await expect.poll(() => onChanged).toHaveBeenLastCalledWith(`${lines.join('\n')}\n`);
};

test('Alt+ArrowUp moves a paragraph before the previous paragraph', async () => {
	const onChanged = vi.fn();

	await renderRichEditorInDOM({
		value: ['First paragraph', '', 'Second paragraph', '', 'Third paragraph'].join(
			'\n',
		),
		onChanged,
	});

	await act(async () => {
		await page.getByText('Second paragraph', { exact: true }).click();
	});
	await moveSelection('up');

	await expectMarkdown(onChanged, [
		'Second paragraph',
		'',
		'First paragraph',
		'',
		'Third paragraph',
	]);
});

test('Alt+ArrowDown moves a paragraph after the next paragraph', async () => {
	const onChanged = vi.fn();

	await renderRichEditorInDOM({
		value: ['First paragraph', '', 'Second paragraph', '', 'Third paragraph'].join(
			'\n',
		),
		onChanged,
	});

	await act(async () => {
		await page.getByText('Second paragraph', { exact: true }).click();
	});
	await moveSelection('down');

	await expectMarkdown(onChanged, [
		'First paragraph',
		'',
		'Third paragraph',
		'',
		'Second paragraph',
	]);
});

test('Alt+ArrowDown moves selected paragraphs together', async () => {
	const onChanged = vi.fn();

	await renderRichEditorInDOM({
		value: ['Green cup', '', 'Red cup', '', 'Black cup'].join('\n'),
		onChanged,
	});

	await act(async () => {
		selectContent(document.body, 'Green cup', 'Red cup');
	});
	await moveSelection('down');

	await expectMarkdown(onChanged, ['Black cup', '', 'Green cup', '', 'Red cup']);
});

test('Alt+ArrowUp moves selected paragraphs together', async () => {
	const onChanged = vi.fn();

	await renderRichEditorInDOM({
		value: ['Green cup', '', 'Red cup', '', 'Black cup'].join('\n'),
		onChanged,
	});

	await act(async () => {
		selectContent(document.body, 'Red cup', 'Black cup');
	});
	await moveSelection('up');

	await expectMarkdown(onChanged, ['Red cup', '', 'Black cup', '', 'Green cup']);
});

test('Alt+ArrowUp does not move the first paragraph past the document boundary', async () => {
	const onChanged = vi.fn();

	await renderRichEditorInDOM({
		value: ['First paragraph', '', 'Last paragraph'].join('\n'),
		onChanged,
	});

	await act(async () => {
		await page.getByText('First paragraph', { exact: true }).click();
	});
	await moveSelection('up');

	expect(onChanged).not.toHaveBeenCalled();
	const paragraphs = page.getByRole('paragraph');
	expect(paragraphs).toHaveLength(2);
	expect(paragraphs.nth(0)).toHaveTextContent('First paragraph');
	expect(paragraphs.nth(1)).toHaveTextContent('Last paragraph');
});

test('Alt+ArrowDown does not move the last paragraph past the document boundary', async () => {
	const onChanged = vi.fn();

	await renderRichEditorInDOM({
		value: ['First paragraph', '', 'Last paragraph'].join('\n'),
		onChanged,
	});

	await act(async () => {
		await page.getByText('Last paragraph', { exact: true }).click();
	});
	await moveSelection('down');

	expect(onChanged).not.toHaveBeenCalled();
	const paragraphs = page.getByRole('paragraph');
	expect(paragraphs).toHaveLength(2);
	expect(paragraphs.nth(0)).toHaveTextContent('First paragraph');
	expect(paragraphs.nth(1)).toHaveTextContent('Last paragraph');
});

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

	const editor = page.getByRole('textbox');
	const list = editor.getByRole('list');

	await act(async () => {
		await list.click();
		selectContent(editor.element() as HTMLElement, 'First item', 'Second item');
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

	const editor = page.getByRole('textbox');
	const secondItem = editor.getByText('Second item', { exact: true });

	await act(async () => {
		await secondItem.click();
	});
	await moveSelection('down');

	await expectMarkdown(onChanged, ['- First item', '- Third item', '- Second item']);
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

	const editor = page.getByRole('textbox');
	const firstItem = editor.getByText('First item', { exact: true });

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

	const editor = page.getByRole('textbox');
	const lastItem = editor.getByText('Second item', { exact: true });

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

	const editor = page.getByRole('textbox');
	const nestedOne = editor.getByText('Nested one', { exact: true });

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

	const editor = page.getByRole('textbox');
	const nestedTwo = editor.getByText('Nested two', { exact: true });

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

	const editor = page.getByRole('textbox');
	const movingChild = editor.getByText('Moving child', { exact: true });

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

	const editor = page.getByRole('textbox');
	const movingChild = editor.getByText('Moving child', { exact: true });

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

	const editor = page.getByRole('textbox');
	const nestedOne = editor.getByText('Nested one', { exact: true });

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

	const editor = page.getByRole('textbox');
	const deepTwo = editor.getByText('Deep two', { exact: true });

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

	const editor = page.getByRole('textbox');
	const deepOnly = editor.getByText('Deep only', { exact: true });

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

	const editor = page.getByRole('textbox');
	const movingChild = editor.getByText('Moving child', { exact: true });

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

	const editor = page.getByRole('textbox');
	const movingChild = editor.getByText('Moving child', { exact: true });

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

	const editor = page.getByRole('textbox');
	await act(async () => {
		selectContent(editor.element() as HTMLElement, 'First', 'Second');
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

	const editor = page.getByRole('textbox');
	const movingChild = editor.getByText('Moving child', { exact: true });

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

test('Alt+ArrowUp moves a quote paragraph before the previous quote paragraph', async () => {
	const onChanged = vi.fn();

	await renderRichEditorInDOM({
		value: [
			'Before',
			'',
			'> Quote one',
			'>',
			'> Quote two',
			'>',
			'> Quote three',
			'',
			'After',
		].join('\n'),
		onChanged,
	});

	const editor = page.getByRole('textbox');
	const quote = editor.getByRole('blockquote');
	const paragraphs = quote.getByRole('paragraph');

	await act(async () => {
		await paragraphs.nth(1).click();
	});
	await moveSelection('up');

	await expectMarkdown(onChanged, [
		'Before',
		'',
		'> Quote two',
		'>',
		'> Quote one',
		'>',
		'> Quote three',
		'',
		'After',
	]);
});

test('Alt+ArrowUp moves the whole quote before the previous paragraph', async () => {
	const onChanged = vi.fn();

	await renderRichEditorInDOM({
		value: [
			'Before',
			'',
			'> Quote one',
			'>',
			'> Quote two',
			'>',
			'> Quote three',
			'',
			'After',
		].join('\n'),
		onChanged,
	});

	const editor = page.getByRole('textbox');
	const quote = editor.getByRole('blockquote');
	const firstParagraph = quote.getByRole('paragraph').nth(0);

	await act(async () => {
		await firstParagraph.click();
	});
	await moveSelection('up');

	await expectMarkdown(onChanged, [
		'> Quote one',
		'>',
		'> Quote two',
		'>',
		'> Quote three',
		'',
		'Before',
		'',
		'After',
	]);
});

test('Alt+ArrowUp moves a mixed list, paragraph, and quote selection together', async () => {
	const onChanged = vi.fn();

	await renderRichEditorInDOM({
		value: [
			'Before',
			'',
			'- One',
			'- Two',
			'',
			'Between',
			'',
			'> Quote',
			'',
			'After',
		].join('\n'),
		onChanged,
	});

	const editor = page.getByRole('textbox');
	await act(async () => {
		selectContent(editor.element() as HTMLElement, 'One', 'Quote');
	});
	await moveSelection('up');

	await expectMarkdown(onChanged, [
		'- One',
		'- Two',
		'',
		'Between',
		'',
		'> Quote',
		'',
		'Before',
		'',
		'After',
	]);
});

test('Alt+ArrowUp keeps the cursor in a moved list item', async () => {
	await renderRichEditorInDOM({
		value: ['- foo', '- bar', '- baz'].join('\n'),
	});

	const editor = page.getByRole('textbox');
	const bar = editor.getByRole('listitem').nth(1);

	await act(async () => {
		await bar.click();
	});
	await moveSelection('up');

	await act(async () => {
		await userEvent.keyboard('X');
	});

	expect(editor.getByRole('listitem').nth(0)).toHaveTextContent('barX');
	expect(editor.getByRole('listitem').nth(1)).toHaveTextContent('foo');
});
