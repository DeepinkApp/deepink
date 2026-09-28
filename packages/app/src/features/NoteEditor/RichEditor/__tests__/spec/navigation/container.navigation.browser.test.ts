import { act } from 'react';
import { page } from 'vitest/browser';

import { renderRichEditorInDOM } from '../../utils/renderEditorInDOM';
import { selectContent, setCursorPosition } from '../../utils/utils';

import { expectMarkdown, moveSelection } from './utils';

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

	const quoteParagraph = page.getByText('Quote two', { exact: true });
	await act(async () => {
		await quoteParagraph.click();
		setCursorPosition(quoteParagraph.element(), 0);
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

	const firstQuoteParagraph = page.getByText('Quote one', { exact: true });
	await act(async () => {
		await firstQuoteParagraph.click();
		setCursorPosition(firstQuoteParagraph.element(), 0);
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

	await act(async () => {
		selectContent(page.getByRole('textbox').element() as HTMLElement, 'One', 'Quote');
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
