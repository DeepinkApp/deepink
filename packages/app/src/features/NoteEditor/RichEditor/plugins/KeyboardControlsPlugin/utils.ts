import { LexicalNode } from 'lexical';
import { $isListItemNode, ListItemNode } from '@lexical/list';

export const $hasSelectedAncestor = (
	node: LexicalNode,
	listItems: Map<string, ListItemNode>,
): boolean => {
	const parent = node.getParent();
	if (!parent) return false;

	if ($isListItemNode(parent) && listItems.has(parent.getKey())) return true;

	return $hasSelectedAncestor(parent, listItems);
};
