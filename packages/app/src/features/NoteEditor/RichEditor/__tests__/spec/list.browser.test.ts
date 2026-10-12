import { act } from 'react';
import { page, userEvent, utils } from 'vitest/browser';

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

test('unlisting a top-level list creates one paragraph per item', async () => {
	const richEditor = await renderRichEditorInDOM({
		value: '- First\n- Second\n- Third',
	});
	const editor = page.getByRole('textbox');

	await act(async () => {
		await editor.getByText('Second', { exact: true }).click();
		await userEvent.keyboard('{End}');
	});
	await richEditor.insert({ type: 'list', data: { type: 'unordered' } });

	expect(editor.getByRole('list')).toHaveLength(0);
	const paragraphs = editor.getByRole('paragraph');
	expect(paragraphs).toHaveLength(3);
	expect(paragraphs.nth(0)).toHaveTextContent('First');
	expect(paragraphs.nth(1)).toHaveTextContent('Second');
	expect(paragraphs.nth(2)).toHaveTextContent('Third');
});

test('list command falls through to Lexical when the requested type differs', async () => {
	const richEditor = await renderRichEditorInDOM({
		value: '- [ ] First item\n- [ ] Second item',
	});
	const editor = page.getByRole('textbox');

	await act(async () => {
		await editor.getByText('First item', { exact: true }).click();
		await userEvent.keyboard('{End}');
	});
	await richEditor.insert({ type: 'list', data: { type: 'unordered' } });

	expect(editor.getByRole('list')).toHaveLength(1);
	expect(editor.getByRole('listitem')).toHaveLength(2);
	expect(editor.getByRole('checkbox')).toHaveLength(0);
	expect(editor.getByRole('list').element().tagName).toBe('UL');
});

test('unlisting a nested list turns its items into lines inside the parent item', async () => {
	const richEditor = await renderRichEditorInDOM({
		value: ['- [ ] 1', '  - [ ] 2', '    - [ ] 3', '- [ ] 4', '- [ ] 5'].join('\n'),
	});
	const editor = page.getByRole('textbox');

	await act(async () => {
		await editor.getByText('2', { exact: true }).click();
		await userEvent.keyboard('{End}');
	});
	await richEditor.insert({ type: 'list', data: { type: 'checkbox' } });

	const items = editor.getByRole('checkbox');
	expect(items).toHaveLength(3);
	expect(items.nth(0)).toHaveTextContent('1');
	expect(items.nth(1)).toHaveTextContent('4');
	expect(items.nth(2)).toHaveTextContent('5');

	const parentItem = items.nth(0);
	expect(parentItem.getByRole('list')).toHaveLength(0);
	expect(parentItem.getByRole('paragraph')).toHaveLength(0);
	expect(parentItem.element().querySelectorAll('br')).toHaveLength(2);
	expect(parentItem).toHaveTextContent('123');

	const serialized = richEditor.getMarkdown();
	expect(serialized.indexOf('1')).toBeLessThan(serialized.indexOf('2'));
	expect(serialized.indexOf('2')).toBeLessThan(serialized.indexOf('3'));
	await richEditor.render({ value: serialized });
	expect(richEditor.getMarkdown()).toBe(serialized);
	expect(page.getByRole('checkbox')).toHaveLength(3);
	expect(page.getByRole('list')).toHaveLength(1);
	expect(
		page.getByRole('checkbox').nth(0).element().querySelectorAll('br'),
	).toHaveLength(2);
});

test('a partial selection unlists the whole touched nested list', async () => {
	const richEditor = await renderRichEditorInDOM({
		value: ['- Parent', '  - First child', '  - Second child', '- Next'].join('\n'),
	});
	const editor = page.getByRole('textbox');

	await act(async () => {
		selectContent(editor.element() as HTMLElement, 'First child');
	});
	await richEditor.insert({ type: 'list', data: { type: 'unordered' } });

	expect(editor.getByRole('list')).toHaveLength(1);
	expect(editor.getByRole('listitem')).toHaveLength(2);
	expect(
		editor.getByRole('listitem').nth(0).element().querySelectorAll('br'),
	).toHaveLength(2);
	expect(editor.getByRole('listitem').nth(0)).toHaveTextContent(
		'ParentFirst childSecond child',
	);
	const serialized = richEditor.getMarkdown();
	expect(serialized.indexOf('Parent')).toBeLessThan(serialized.indexOf('First child'));
	expect(serialized.indexOf('First child')).toBeLessThan(
		serialized.indexOf('Second child'),
	);
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

describe('Regressions', () => {
	describe('Different lists separated by blank lines remain separate', () => {
		[
			{
				name: 'regular list and checklist',
				expectedLists: 2,
				content: [
					'- foo',
					'- bar',
					'- baz',
					'',
					'- [ ] 1',
					'- [ ] 2',
					'- [ ] 3',
				].join('\n'),
			},
			{
				name: 'regular list and ordered list',
				expectedLists: 2,
				content: ['- foo', '- bar', '- baz', '', '1. 1', '2. 2', '3. 3'].join(
					'\n',
				),
			},
			{
				name: 'regular list, ordered list, checkbox list',
				expectedLists: 3,
				content: [
					'- foo',
					'- bar',
					'- baz',
					'',
					'1. 1',
					'2. 2',
					'3. 3',
					'',
					'- [ ] 1',
					'- [ ] 2',
					'- [ ] 3',
				].join('\n'),
			},
		].forEach(({ name, content, expectedLists }) =>
			test(name, async () => {
				const { render, getMarkdown, getEditor } = await renderRichEditorInDOM({
					value: content,
				});

				expect(
					page.getByRole('list').all(),
					'There are expected number of lists',
				).toHaveLength(expectedLists);

				const rootNode = getEditor().getRootElement();
				const getHTML = () => utils.prettyDOM(rootNode);

				const htmlV1 = getHTML();
				const markdownV1 = getMarkdown();

				// Cleanup and re-render
				await render({ value: '' });
				await expect.poll(() => rootNode).toHaveTextContent('');

				// Make sure the roundtrip are consistent
				await render({ value: markdownV1 });
				expect(getHTML()).toBe(htmlV1);
				expect(getMarkdown()).toBe(markdownV1);
			}),
		);
	});

	test('3 empty lines splits the lists', async () => {
		const editor1 = await renderRichEditorInDOM({
			value: '',
		});

		const editor1Locator = page
			.elementLocator(editor1.getEditor().getRootElement()!)
			.first();

		// Create 2 lists
		await act(async () => {
			await editor1Locator.click();
		});
		await editor1.insert({ type: 'list', data: { type: 'unordered' } });
		await act(async () => {
			await userEvent.keyboard('foo');
			await userEvent.keyboard('{Enter}'.repeat(3));
		});

		await editor1.insert({ type: 'list', data: { type: 'unordered' } });
		await act(async () => {
			await userEvent.keyboard('bar');
		});

		expect(editor1Locator.getByRole('list').all()).toHaveLength(2);
		expect(editor1Locator.getByRole('listitem').all()).toHaveLength(2);

		// Create another editor with serialized content
		const editor2 = await renderRichEditorInDOM({
			value: editor1.getMarkdown(),
		});

		const editor2Locator = page.elementLocator(editor2.getEditor().getRootElement()!);
		expect(editor2Locator.getByRole('list').all()).toHaveLength(2);
		expect(editor2Locator.getByRole('listitem').all()).toHaveLength(2);

		// Content must be equal
		expect(editor1Locator.element()).not.toBe(editor2Locator.element());
		expect(utils.prettyDOM(editor2Locator)).toBe(utils.prettyDOM(editor1Locator));
		expect(editor2.getMarkdown()).toBe(editor1.getMarkdown());
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

	test('list kind changes split items even without a blank line', async () => {
		await renderRichEditorInDOM({
			value: '- regular\n- [ ] task\n- regular again',
		});

		expect(page.getByRole('list').all()).toHaveLength(3);
		expect(page.getByRole('checkbox')).toHaveLength(1);
	});

	test('checked and unchecked task items remain in the same checklist', async () => {
		await renderRichEditorInDOM({
			value: '- [ ] first\n\n- [x] second\n - [ ] third',
		});

		expect(page.getByRole('list').all()).toHaveLength(1);
		expect(page.getByRole('checkbox')).toHaveLength(3);
	});

	test('ordered list numbering is retained after a task item splits the list', async () => {
		await renderRichEditorInDOM({
			value: '3. regular\n4. [ ] task\n5. regular again',
		});

		const editor = page.getByRole('textbox');
		const orderedLists = editor.element().querySelectorAll(':scope > ol');

		expect(orderedLists).toHaveLength(2);
		expect(orderedLists[0].getAttribute('start')).toBe('3');
		expect(orderedLists[1].getAttribute('start')).toBe('5');
		expect(editor.getByRole('checkbox')).toHaveLength(1);
	});
});
