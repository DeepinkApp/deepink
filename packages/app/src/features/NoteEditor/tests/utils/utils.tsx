import { fireEvent, screen } from '@testing-library/react';

/**
 * Simulates a text selection in the editor.
 * Selects everything from the beginning of `startText` to the end of `endText`;
 * If `endText` is omitted, selects the entire `startText`.
 */
export const selectContent = (startText: string, endText?: string) => {
	const startNode = screen.getByText(startText).firstChild;
	expect(startNode).toBeInstanceOf(Text);

	const range = document.createRange();
	range.setStart(startNode as Text, 0);

	// If `endText` is provided, select the range from `startText` to `endText`;
	// otherwise, select the entire `startText`.
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
 * Simulates moving the cursor to the start of a text node and dispatches a `selectionchange` event
 */
export const setCursorPosition = (node: Text) => {
	const range = document.createRange();

	range.setStart(node, 0);
	range.setEnd(node, 0);

	window.getSelection()?.removeAllRanges();
	window.getSelection()?.addRange(range);

	fireEvent(document, new Event('selectionchange'));
};
