import { page } from 'vitest/browser';
import { renderRichEditorInDOM } from '@features/NoteEditor/RichEditor/__tests__/utils/renderEditorInDOM';

test('same-kind lists separated by a large gap retain their boundaries and empty items', async () => {
	const source = [
		'- first',
		...Array(10).fill('-'),
		...Array(100).fill(''),
		'* second',
		...Array(10).fill('*'),
	].join('\n');
	const { getEditor, getMarkdown, render } = await renderRichEditorInDOM({
		value: source,
	});

	const editor = page.getByRole('textbox');
	const getListItemCounts = () =>
		Array.from(
			getEditor().getRootElement()?.querySelectorAll(':scope > ul') ?? [],
		).map((list) => list.querySelectorAll(':scope > li').length);
	const getGapParagraphCount = () =>
		getEditor().getRootElement()?.querySelectorAll(':scope > p').length ?? 0;

	expect(getListItemCounts()).toEqual([11, 11]);
	expect(editor.getByRole('listitem')).toHaveLength(22);
	expect(getGapParagraphCount()).toBe(98);
	expect(editor.getByRole('listitem').nth(1)).toHaveTextContent('');
	expect(editor.getByRole('listitem').nth(12)).toHaveTextContent('');

	const serialized = getMarkdown();
	expect(serialized).toContain('- first');
	expect(serialized).toContain('* second');

	await render({ value: serialized });

	expect(getListItemCounts()).toEqual([11, 11]);
	expect(page.getByRole('listitem')).toHaveLength(22);
	expect(getGapParagraphCount()).toBe(98);
	expect(getMarkdown()).toBe(serialized);
});

test('a single empty editor paragraph keeps same-kind lists separate after round-trip', async () => {
	const { getEditor, getMarkdown, render } = await renderRichEditorInDOM({
		value: '- first\n\n\n\n* second',
	});
	const root = () => getEditor().getRootElement()!;
	const getTopLevelLists = () => root().querySelectorAll(':scope > ul');
	const getTopLevelParagraphs = () => root().querySelectorAll(':scope > p');

	expect(getTopLevelLists()).toHaveLength(2);
	expect(getTopLevelParagraphs()).toHaveLength(1);

	const serialized = getMarkdown();
	expect(serialized).toContain('- first');
	expect(serialized).toContain('* second');

	await render({ value: serialized });

	expect(getTopLevelLists()).toHaveLength(2);
	expect(getTopLevelParagraphs()).toHaveLength(1);
	expect(getMarkdown()).toBe(serialized);
});

test('a list with many empty items remains one list', async () => {
	const source = ['- first', ...Array(100).fill('-'), '- last'].join('\n');
	const { getEditor, getMarkdown, render } = await renderRichEditorInDOM({
		value: source,
	});

	const getListItemCount = () =>
		getEditor().getRootElement()?.querySelectorAll(':scope > ul > li').length;
	expect(getEditor().getRootElement()?.querySelectorAll(':scope > ul')).toHaveLength(1);
	expect(getListItemCount()).toBe(102);

	const serialized = getMarkdown();
	await render({ value: serialized });

	expect(getEditor().getRootElement()?.querySelectorAll(':scope > ul')).toHaveLength(1);
	expect(getListItemCount()).toBe(102);
	expect(getMarkdown()).toBe(serialized);
});
