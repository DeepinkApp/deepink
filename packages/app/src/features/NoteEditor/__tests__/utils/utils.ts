import { fireEvent, within } from '@testing-library/react';

const getFirstTextNode = (node: Node): Text | null => {
	if (node.nodeType === Node.TEXT_NODE) return node as Text;

	for (const child of Array.from(node.childNodes)) {
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
 * Selects text starting from `startText`, if `endText` is provided, selects everything up to the end of `endText`.
 * Otherwise, selects only `startText`.
 */
export const selectContent = (
	parent: HTMLElement,
	startText: string,
	endText?: string,
) => {
	const startNode = getFirstTextNode(within(parent).getByText(startText));
	if (!startNode) throw new Error(`Text node not found for "${startText}"`);

	const range = document.createRange();
	range.setStart(startNode, 0);

	if (endText) {
		const endNode = getFirstTextNode(within(parent).getByText(endText));
		if (!endNode) throw new Error(`Text node not found for "${endText}"`);

		range.setEnd(endNode, endText.length);
	} else {
		range.setEnd(startNode, startText.length);
	}

	window.getSelection()?.removeAllRanges();
	window.getSelection()?.addRange(range);

	fireEvent(document, new Event('selectionchange'));
};

/**
 * Selects the given text within a provided element
 */
export const selectPartialContent = (element: HTMLElement, text: string) => {
	const textNode = getFirstTextNode(element);
	if (!textNode) throw new Error('No text node found in the provided element');

	const textStart = textNode.textContent.indexOf(text);

	const range = document.createRange();
	range.setStart(textNode, textStart);
	range.setEnd(textNode, textStart + text.length);

	window.getSelection()?.removeAllRanges();
	window.getSelection()?.addRange(range);

	fireEvent(document, new Event('selectionchange'));
};

/**
 * Simulates placing the cursor at a given position within a node.
 * Finds the first text node inside `node` and places the cursor at position
 */
export const setCursorPosition = (node: Node, position: number) => {
	const textNode = getFirstTextNode(node);
	if (!textNode) throw new Error(`Text node not found inside ${node.nodeName}`);

	const range = document.createRange();

	range.setStart(textNode, position);
	range.setEnd(textNode, position);

	window.getSelection()?.removeAllRanges();
	window.getSelection()?.addRange(range);

	fireEvent(document, new Event('selectionchange'));
};
