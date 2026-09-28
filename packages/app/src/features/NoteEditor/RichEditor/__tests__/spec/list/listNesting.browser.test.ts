import { act } from 'react';
import { page, userEvent } from 'vitest/browser';

import { renderRichEditorInDOM } from '../../utils/renderEditorInDOM';
import { selectContent } from '../../utils/utils';

const selectContentBackward = (
	container: HTMLElement,
	startText: string,
	endText: string,
) => {
	const getTextNode = (text: string) => {
		const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
		while (walker.nextNode()) {
			if (walker.currentNode.textContent === text)
				return walker.currentNode as Text;
		}
		throw new Error(`Text node not found for "${text}"`);
	};

	const start = getTextNode(startText);
	const end = getTextNode(endText);
	const selection = window.getSelection();
	if (!selection) throw new Error('Browser selection is unavailable');

	selection.removeAllRanges();
	selection.collapse(end, end.length);
	selection.extend(start, 0);
	if (selection.anchorNode !== end || selection.focusNode !== start) {
		throw new Error('Failed to create a backward browser selection');
	}
	document.dispatchEvent(new Event('selectionchange'));
};

const selectItems = (
	container: HTMLElement,
	direction: 'forward' | 'backward',
	startText: string,
	endText: string,
) => {
	if (direction === 'forward') {
		selectContent(container, startText, endText);
	} else {
		selectContentBackward(container, startText, endText);
	}
};

test.each(['forward', 'backward'] as const)(
	'%s selection preserves selected item order when nesting',
	async (direction) => {
		const onChanged = vi.fn();
		await renderRichEditorInDOM({
			value: ['- First', '- Second', '- Third', '- Fourth'].join('\n'),
			onChanged,
		});

		await act(async () => {
			await page.getByRole('textbox').click();
			selectItems(
				page.getByRole('textbox').element() as HTMLElement,
				direction,
				'Second',
				'Third',
			);
			await userEvent.keyboard('[ControlLeft>][BracketRight][/ControlLeft]');
		});

		await expect
			.poll(() => onChanged)
			.toHaveBeenLastCalledWith('- First\n  - Second\n  - Third\n- Fourth\n');
	},
);

test.each(['forward', 'backward'] as const)(
	'%s selection preserves selected item order when outdenting items with following siblings',
	async (direction) => {
		const onChanged = vi.fn();
		await renderRichEditorInDOM({
			value: [
				'- Parent',
				'  - First',
				'  - Second',
				'  - Third',
				'  - Following',
			].join('\n'),
			onChanged,
		});

		await act(async () => {
			await page.getByRole('textbox').click();
			selectItems(
				page.getByRole('textbox').element() as HTMLElement,
				direction,
				'Second',
				'Third',
			);
			await userEvent.keyboard('[ControlLeft>][BracketLeft][/ControlLeft]');
		});

		await expect
			.poll(() => onChanged)
			.toHaveBeenLastCalledWith(
				'- Parent\n  - First\n- Second\n- Third\n  - Following\n',
			);
	},
);

test('nesting a selected descendant still works when its selected ancestor is at the boundary', async () => {
	const onChanged = vi.fn();
	await renderRichEditorInDOM({
		value: ['- Root', '  - Parent', '    - Previous', '    - Selected'].join('\n'),
		onChanged,
	});

	await act(async () => {
		await page.getByRole('textbox').click();
		selectContent(
			page.getByRole('textbox').element() as HTMLElement,
			'Parent',
			'Selected',
		);
		await userEvent.keyboard('[ControlLeft>][BracketRight][/ControlLeft]');
	});

	await expect
		.poll(() => onChanged)
		.toHaveBeenLastCalledWith(
			'- Root\n  - Parent\n    - Previous\n      - Selected\n',
		);
});

test('Tab on the first item leaves the list unchanged and keeps editor focus', async () => {
	const onChanged = vi.fn();
	await renderRichEditorInDOM({
		value: ['- First', '- Second'].join('\n'),
		onChanged,
	});

	const editor = page.getByRole('textbox');
	const firstItem = editor.getByText('First', { exact: true });

	await act(async () => {
		await firstItem.click();
		await userEvent.keyboard('{Tab}');
	});

	expect(editor).toHaveFocus();
	expect(editor.getByRole('listitem')).toHaveLength(2);
	expect(editor.getByRole('listitem').nth(0)).toHaveTextContent('First');
	expect(editor.getByRole('listitem').nth(1)).toHaveTextContent('Second');
});
