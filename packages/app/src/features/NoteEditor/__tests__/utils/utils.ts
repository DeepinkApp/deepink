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

		range.setEnd(endNode, endNode.textContent.length);
	} else {
		range.setEnd(startNode, startNode.textContent.length);
	}

	window.getSelection()?.removeAllRanges();
	window.getSelection()?.addRange(range);

	fireEvent(document, new Event('selectionchange'));
};

/**
 * Selects the given text within a provided element
 */
export const selectText = (element: HTMLElement, text: string) => {
	const textNode = getFirstTextNode(element);
	if (!textNode) throw new Error('No text node found in the provided element');

	const startPosition = textNode.textContent.indexOf(text);
	if (startPosition === -1)
		throw new Error(`Text "${text}" not found in the provided element`);

	const range = document.createRange();
	range.setStart(textNode, startPosition);
	range.setEnd(textNode, startPosition + text.length);

	window.getSelection()?.removeAllRanges();
	window.getSelection()?.addRange(range);

	fireEvent(document, new Event('selectionchange'));
};

/**
 * Simulates placing the cursor at a given position within a node
 */
export const setCursorPosition = (container: Node, offset: number) => {
	const textNode = getFirstTextNode(container);
	if (!textNode) throw new Error(`Text node not found inside ${container.nodeName}`);

	const range = document.createRange();

	range.setStart(textNode, offset);
	range.setEnd(textNode, offset);

	window.getSelection()?.removeAllRanges();
	window.getSelection()?.addRange(range);

	fireEvent(document, new Event('selectionchange'));
};
