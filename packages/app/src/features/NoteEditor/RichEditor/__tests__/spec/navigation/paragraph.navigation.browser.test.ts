import { act } from 'react';
import { page } from 'vitest/browser';

import { renderRichEditorInDOM } from '../../utils/renderEditorInDOM';
import { selectContent } from '../../utils/utils';

import { expectMarkdown, moveSelection } from './utils';

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
		selectContent(
			page.getByRole('textbox').element() as HTMLElement,
			'Green cup',
			'Red cup',
		);
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
		selectContent(
			page.getByRole('textbox').element() as HTMLElement,
			'Red cup',
			'Black cup',
		);
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
	expect(page.getByRole('paragraph')).toHaveLength(2);
	expect(page.getByRole('paragraph').nth(0)).toHaveTextContent('First paragraph');
	expect(page.getByRole('paragraph').nth(1)).toHaveTextContent('Last paragraph');
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
	expect(page.getByRole('paragraph')).toHaveLength(2);
	expect(page.getByRole('paragraph').nth(0)).toHaveTextContent('First paragraph');
	expect(page.getByRole('paragraph').nth(1)).toHaveTextContent('Last paragraph');
});
