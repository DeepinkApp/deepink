import { fireEvent } from '@testing-library/react';

/**
 * Selects text within a Text node and dispatches a selectionchange event
 */
export const setTextSelection = (node: Text, start: number, end: number) => {
	const range = document.createRange();

	range.setStart(node, start);
	range.setEnd(node, end);

	window.getSelection()?.removeAllRanges();
	window.getSelection()?.addRange(range);

	fireEvent(document, new Event('selectionchange'));
};

/**
 * Places the cursor at the start of a text node and dispatches a selectionchange event.
 */
export const setCursorPosition = (node: Text) => {
	const range = document.createRange();

	range.setStart(node, 0);
	range.setEnd(node, 0);

	const selection = window.getSelection();
	selection?.removeAllRanges();
	selection?.addRange(range);

	fireEvent(document, new Event('selectionchange'));
};
