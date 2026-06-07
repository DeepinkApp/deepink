import { fireEvent, screen } from '@testing-library/react';

const getFirstTextNode = (node: Node): Text | null => {
	if (node.nodeType === Node.TEXT_NODE) return node as Text;

	for (const child of node.childNodes) {
		if (child.nodeType === Node.TEXT_NODE) {
			return child as Text;
		}
		if (child.nodeType === Node.ELEMENT_NODE) {
			const textNode = getFirstTextNode(child);
			if (textNode) return textNode;
		}
	}
	return null;
};

/**
 * Simulates a text selection in the editor.
 * Selects everything from the beginning of `startText` to the end of `endText`;
 * If `endText` is omitted, selects the entire `startText`.
 */
export const selectContent = (startText: string, endText?: string) => {
	const startNode = getFirstTextNode(screen.getByText(startText));
	if (!startNode) throw new Error(`Text node not found for "${startText}"`);

	const range = document.createRange();
	range.setStart(startNode, 0);

	// If `endText` is provided, select the range from `startText` to `endText`;
	// otherwise, select the entire `startText`.
	if (endText) {
		const endNode = getFirstTextNode(screen.getByText(endText));
		if (!endNode) throw new Error(`Text node not found for "${endNode}"`);

		range.setEnd(endNode, endText.length);
	} else {
		range.setEnd(startNode, startText.length);
	}

	window.getSelection()?.removeAllRanges();
	window.getSelection()?.addRange(range);

	fireEvent(document, new Event('selectionchange'));
};

/**
 * Simulates placing the cursor at the start of a node.
 * Finds the first text node inside node, places the cursor there, and dispatches a `selectionchange` event.
 */
export const setCursorPosition = (node: Node) => {
	const textNode = getFirstTextNode(node);
	if (!textNode) throw new Error(`Text node not found inside ${node.nodeName}`);

	const range = document.createRange();

	range.setStart(textNode, 0);
	range.setEnd(textNode, 0);

	window.getSelection()?.removeAllRanges();
	window.getSelection()?.addRange(range);

	fireEvent(document, new Event('selectionchange'));
};
