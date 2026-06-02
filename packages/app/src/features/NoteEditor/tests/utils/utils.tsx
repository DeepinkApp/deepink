import { fireEvent, screen } from '@testing-library/react';

/**
 * Selects text within a Text node and dispatches a selectionchange event
 */
export const selectContent = (startText: string, endText?: string) => {
	const startNode = screen.getByText(startText).firstChild;
	expect(startNode).toBeInstanceOf(Text);

	const range = document.createRange();
	range.setStart(startNode as Text, 0);

	if (endText) {
		const endNode = screen.getByText(endText).firstChild;
		expect(endNode).toBeInstanceOf(Text);

		range.setEnd(endNode as Text, endText.length);
	} else {
		range.setEnd(startNode as Text, startText.length);
	}

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
