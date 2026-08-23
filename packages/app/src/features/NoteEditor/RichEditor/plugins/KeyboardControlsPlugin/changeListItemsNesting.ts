import { RangeSelection } from 'lexical';
import {
	$createListNode,
	$isListItemNode,
	$isListNode,
	ListItemNode,
} from '@lexical/list';

import { $getSelectedListItems } from './getSelectedListItems';

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
	const listItems = $getSelectedListItems(selection);
	if (listItems.length === 0) return false;

	const changedItems = listItems.map((item) =>
		direction === 'decrease'
			? $decreaseListItemNesting(item)
			: $increaseListItemNesting(item),
	);

	return changedItems.some(Boolean);
};
