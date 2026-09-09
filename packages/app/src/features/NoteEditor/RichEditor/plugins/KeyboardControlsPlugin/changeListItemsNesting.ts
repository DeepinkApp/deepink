import { $findMatchingParent, LexicalNode, RangeSelection } from 'lexical';
import {
	$createListNode,
	$isListItemNode,
	$isListNode,
	ListItemNode,
} from '@lexical/list';

/**
 * Increases the nesting level of a list item by moving it inside its previous sibling.
 * Has no effect if the item is already first in its list
 */
const $increaseListItemNesting = (listItem: ListItemNode) => {
	const parentList = listItem.getParent();
	if (!$isListNode(parentList)) return false;

	// Changing nesting is not possible for the first element of the list
	const previousSibling = listItem.getPreviousSibling();
	if (!$isListItemNode(previousSibling)) return true;

	// Move item one level deeper by nesting it under previous sibling
	const listType = parentList.getListType();
	const siblingNestedList = previousSibling
		.getChildren()
		.filter($isListNode)
		.find((list) => list.getListType() === listType);

	// If previous sibling already has a nested list - reuse it, otherwise create a new nested list
	if (siblingNestedList) {
		siblingNestedList.append(listItem);
	} else {
		const newNestedList = $createListNode(listType);
		newNestedList.append(listItem);
		previousSibling.append(newNestedList);
	}

	return true;
};

/**
 * Moves a nested list item one level up.
 * Following siblings are re-nested under the moved item to preserve the list structure
 */
const $decreaseListItemNesting = (listItem: ListItemNode) => {
	const parentList = listItem.getParent();
	if (!$isListNode(parentList)) return false;

	// Cannot unnest a top-level item
	const parentListItem = parentList.getParent();
	if (!$isListItemNode(parentListItem)) return true;

	// Move the item one level up
	const followingListItems = listItem.getNextSiblings().filter($isListItemNode);

	parentListItem.insertAfter(listItem);

	// Keep following siblings nested under the moved item
	if (followingListItems.length > 0) {
		const listType = parentList.getListType();

		const childNestedList = listItem
			.getChildren()
			.filter($isListNode)
			.find((list) => list.getListType() === listType);

		if (childNestedList) {
			followingListItems.forEach((item) => childNestedList.append(item));
		} else {
			const newNestedList = $createListNode(listType);
			followingListItems.forEach((item) => newNestedList.append(item));

			listItem.append(newNestedList);
		}
	}

	if (parentList.getChildrenSize() === 0) {
		parentList.remove();
	}

	return true;
};

const $hasSelectedAncestor = (
	node: LexicalNode,
	selectedListItems: Map<string, ListItemNode>,
): boolean => {
	const parent = node.getParent();
	if (!parent) return false;

	if ($isListItemNode(parent) && selectedListItems.has(parent.getKey())) return true;

	return $hasSelectedAncestor(parent, selectedListItems);
};

/**
 * Applies increase/decrease nesting for selected list items
 */
export const $changeListItemsNesting = (
	selection: RangeSelection,
	direction: 'increase' | 'decrease',
): boolean => {
	const selectedItems = new Map<string, ListItemNode>();

	selection.getNodes().forEach((node) => {
		const listItem = $findMatchingParent(node, $isListItemNode);

		if (listItem) selectedItems.set(listItem.getKey(), listItem);
	});

	const listItems = Array.from(selectedItems.values());
	if (listItems.length === 0) return false;

	let changedItems: boolean[];
	if (direction === 'increase') {
		// Filter out children if their parent is selected,
		// because moving the parent automatically brings its children along
		changedItems = listItems
			.filter((item) => !$hasSelectedAncestor(item, selectedItems))
			.map($increaseListItemNesting);
	} else {
		// Process list items bottom-up to prevent children from being orphaned or shifted early
		changedItems = listItems.toReversed().map($decreaseListItemNesting);
	}

	return changedItems.some(Boolean);
};
