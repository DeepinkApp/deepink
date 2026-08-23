import { $findMatchingParent, LexicalNode, RangeSelection } from 'lexical';
import { $isListItemNode, ListItemNode } from '@lexical/list';

const $hasSelectedAncestor = (
	node: LexicalNode,
	listItems: Map<string, ListItemNode>,
): boolean => {
	const parent = node.getParent();
	if (!parent) return false;

	if ($isListItemNode(parent) && listItems.has(parent.getKey())) return true;

	return $hasSelectedAncestor(parent, listItems);
};

/**
 * Returns the topmost selected list items — descendants of an already selected ancestor are excluded, since they move with their parent
 */
export const $getSelectedListItems = (selection: RangeSelection) => {
	const nodes = selection.getNodes();
	const listItems = new Map<string, ListItemNode>();

	for (const node of nodes) {
		const listItem = $findMatchingParent(node, $isListItemNode);
		if (listItem) {
			listItems.set(listItem.getKey(), listItem);
		}
	}

	return Array.from(listItems.values()).filter(
		(item) => !$hasSelectedAncestor(item, listItems),
	);
};
