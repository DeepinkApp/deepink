import { fireEvent, screen } from '@testing-library/react';

/**
 * Selects text from the beginning of `startText` to the end of `endText` and dispatches a `selectionchange` event
 */
export const selectContent = (startText: string, endText?: string) => {
	const startNode = screen.getByText(startText).firstChild;
	expect(startNode).toBeInstanceOf(Text);

	const range = document.createRange();
	range.setStart(startNode as Text, 0);

	// If no end text is provided, select the entire start text
	// otherwise select range from start to end
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
 * Places the cursor at the start of a text node and dispatches a `selectionchange` event
 */
export const setCursorPosition = (node: Text) => {
	const range = document.createRange();

	range.setStart(node, 0);
	range.setEnd(node, 0);

	window.getSelection()?.removeAllRanges();
	window.getSelection()?.addRange(range);

	fireEvent(document, new Event('selectionchange'));
};
