import { $findMatchingParent, RangeSelection } from 'lexical';
import {
	$createListNode,
	$isListItemNode,
	$isListNode,
	ListItemNode,
} from '@lexical/list';

import { $hasSelectedAncestor } from './utils';

/**
 * Nests a list item one level deep under sibling
 */
const $increaseListItemNesting = (listItem: ListItemNode) => {
	const parentList = listItem.getParent();
	if (!$isListNode(parentList)) return false;

	// Changing nesting is not possible for the first element of the list
	const previousSibling = listItem.getPreviousSibling();
	if (!$isListItemNode(previousSibling)) return true;

	// Move listItem one level deeper by nesting it under previousSibling
	// If previousSibling already has a nested list - reuse it, otherwise create a new nested list
	const listType = parentList.getListType();
	const nestedList = previousSibling
		.getChildren()
		.filter($isListNode)
		.find((list) => list.getListType() === listType);

	if (nestedList) {
		nestedList.append(listItem);
	} else {
		const newNestedList = $createListNode(listType);
		previousSibling.append(newNestedList);
		newNestedList.append(listItem);
	}

	return true;
};

/**
 * Moves a nested list item one level up, re-nesting any following
 * siblings underneath it so they stay its children
 */
const $decreaseListItemNesting = (listItem: ListItemNode) => {
	const currentList = listItem.getParent();
	if (!$isListNode(currentList)) return false;

	// Handle only if listItem is nested, not on the first level
	const parentListItem = currentList.getParent();
	if (!$isListItemNode(parentListItem)) return true;

	// Capture items after listItem — they'll be re-nested under it once it moves up
	const followingListItems = listItem.getNextSiblings().filter($isListItemNode);
	parentListItem.insertAfter(listItem);

	if (followingListItems.length > 0) {
		const newNestedList = $createListNode(currentList.getListType());
		followingListItems.forEach((item) => newNestedList.append(item));
		listItem.append(newNestedList);
	}

	if (currentList.getChildrenSize() === 0) {
		currentList.remove();
	}

	return true;
};

/**
 * Applies increase/decrease nesting for selected list items
 */
export const $changeListItemsNesting = (
	selection: RangeSelection,
	direction: 'increase' | 'decrease',
): boolean => {
	const selectedItems = new Map<string, ListItemNode>();

	for (const node of selection.getNodes()) {
		const listItem = $findMatchingParent(node, $isListItemNode);

		if (listItem) {
			selectedItems.set(listItem.getKey(), listItem);
		}
	}

	const listItems = Array.from(selectedItems.values());
	if (listItems.length === 0) return false;

	// 'increase': Filter out children if their parent is selected, because
	// moving the parent automatically brings its children along
	// 'decrease': Handle both parent and child item. Reverse the order,
	// so moving a parent doesn't prematurely shift or orphan its children before they are processed
	const itemsToProcess =
		direction === 'increase'
			? listItems.filter((item) => !$hasSelectedAncestor(item, selectedItems))
			: [...listItems].reverse();

	const changedItems = itemsToProcess.map((item) =>
		direction === 'increase'
			? $increaseListItemNesting(item)
			: $decreaseListItemNesting(item),
	);

	return changedItems.some(Boolean);
};
