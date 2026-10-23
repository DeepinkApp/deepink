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
	container: Element,
	startText: string,
	endText?: string,
) => {
	if (!(container instanceof HTMLElement)) return;

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
export function selectText(container: Node, text: string): Range {
	const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);

	const nodes: Text[] = [];
	let full = '';

	while (walker.nextNode()) {
		const n = walker.currentNode as Text;
		nodes.push(n);
		full += n.data;
	}

	const start = full.indexOf(text);
	if (start === -1) throw new Error('Not found');

	const end = start + text.length;

	let pos = 0;
	let startNode: Text | undefined;
	let endNode: Text | undefined;
	let startOffset = 0;
	let endOffset = 0;

	for (const n of nodes) {
		const next = pos + n.data.length;

		if (!startNode && start < next) {
			startNode = n;
			startOffset = start - pos;
		}

		if (!endNode && end <= next) {
			endNode = n;
			endOffset = end - pos;
			break;
		}

		pos = next;
	}

	const range = document.createRange();
	range.setStart(startNode!, startOffset);
	range.setEnd(endNode!, endOffset);

	const sel = window.getSelection();
	sel?.removeAllRanges();
	sel?.addRange(range);
	fireEvent(document, new Event('selectionchange'));

	return range;
}

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
