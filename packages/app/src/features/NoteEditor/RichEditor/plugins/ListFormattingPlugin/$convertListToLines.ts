import {
	$createLineBreakNode,
	$createParagraphNode,
	$isParagraphNode,
	LexicalNode,
} from 'lexical';
import { $isListItemNode, $isListNode, ListNode } from '@lexical/list';

const $getLines = (node: LexicalNode): LexicalNode[][] => {
	if ($isListNode(node)) return node.getChildren().flatMap($getLines);
	if (!$isListItemNode(node)) return [];

	const lines: LexicalNode[][] = [];
	let currentLine: LexicalNode[] = [];

	node.getChildren().forEach((child) => {
		if ($isListNode(child)) {
			if (currentLine.length > 0 || lines.length === 0) {
				lines.push(currentLine);
				currentLine = [];
			}
			lines.push(...$getLines(child));
		} else if ($isParagraphNode(child)) {
			currentLine.push(...child.getChildren());
		} else {
			currentLine.push(child);
		}
	});

	if (currentLine.length > 0 || lines.length === 0) lines.push(currentLine);
	return lines;
};

/**
 * Convert list items back into lines, placing nested-list lines in their parent item.
 */
export const $convertListToLines = (list: ListNode) => {
	const parent = list.getParent();
	const lines = $getLines(list);

	if ($isListItemNode(parent)) {
		// Keep converted lines in the item's existing paragraph when it has one.
		const paragraph = parent.getChildren().find($isParagraphNode);
		const append = (node: LexicalNode) => {
			if (paragraph) paragraph.append(node);
			else list.insertBefore(node);
		};

		lines.forEach((line) => {
			append($createLineBreakNode());
			line.forEach(append);
		});
	} else {
		// A top-level list becomes one paragraph per top-level item. Descendants become
		// line breaks within their top-level item's paragraph.
		list.getChildren().forEach((node) => {
			if (!$isListItemNode(node)) return;

			const itemLines = $getLines(node);
			const paragraph = $createParagraphNode();
			itemLines.forEach((line, index) => {
				if (index > 0) paragraph.append($createLineBreakNode());
				paragraph.append(...line);
			});
			list.insertBefore(paragraph);
		});
	}

	list.remove();
};
