import { $createParagraphNode, LexicalNode } from 'lexical';
import { $isListItemNode, $isListNode, ListNode } from '@lexical/list';

/**
 * Convert the list, including nested items, into a sequence of plain paragraphs
 */
export const $convertListToParagraphs = (list: ListNode) => {
	const insertParagraphs = (node: LexicalNode) => {
		if ($isListNode(node)) {
			node.getChildren().forEach(insertParagraphs);
			return;
		}

		if ($isListItemNode(node)) {
			const paragraph = $createParagraphNode();
			const nestedLists: ListNode[] = [];

			node.getChildren().forEach((child) => {
				if ($isListNode(child)) {
					nestedLists.push(child);
				} else {
					paragraph.append(child);
				}
			});

			// The nested list must be handled after the parent to preserve the correct order
			list.insertBefore(paragraph);
			nestedLists.forEach(insertParagraphs);
		}
	};

	insertParagraphs(list);
	list.remove();
};
