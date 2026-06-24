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
 * Selects text between `startText` and `endText`.
 *
 * If `endText` is not provided, the entire text node containing `startText` is selected
 * Otherwise, all content from `startText` to the end of `endText` is selected
 */
export const selectContent = (
	container: HTMLElement,
	startText: string,
	endText?: string,
) => {
	const startNode = getFirstTextNode(within(container).getByText(startText));
	if (!startNode) throw new Error(`Text node not found for "${startText}"`);

	const range = document.createRange();
	range.setStart(startNode, 0);

	if (endText) {
		const endNode = getFirstTextNode(within(container).getByText(endText));
		if (!endNode) throw new Error(`Text node not found for "${endText}"`);

		range.setEnd(endNode, endNode.textContent?.length ?? 0);
	} else {
		range.setEnd(startNode, startNode.textContent?.length ?? 0);
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
	if (textStart === -1)
		throw new Error(`Text "${text}" in provided element not founded not found`);

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
