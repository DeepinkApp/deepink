import { $findMatchingParent, LexicalNode, RangeSelection } from 'lexical';
import {
	$createListNode,
	$isListItemNode,
	$isListNode,
	ListItemNode,
} from '@lexical/list';

import { $getNestedListOfType } from './listNestingUtils';

/**
 * Increases the nesting level of a list item by moving it inside its previous sibling.
 * Has no effect if the item is already first in its list
 */
const $increaseListItemNesting = (listItem: ListItemNode) => {
	const parentList = listItem.getParent();
	if (!$isListNode(parentList)) return false;

	// Changing nesting is not possible for the first element of the list
	const previousSibling = listItem.getPreviousSibling();
	if (!$isListItemNode(previousSibling)) return false;

	// Move item one level deeper by nesting it under previous sibling
	const listType = parentList.getListType();
	const siblingNestedList = $getNestedListOfType(previousSibling, listType);

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
	if (!$isListItemNode(parentListItem)) return false;

	// Move the item one level up
	const followingListItems = listItem.getNextSiblings().filter($isListItemNode);

	parentListItem.insertAfter(listItem);

	// Keep following siblings nested under the moved item
	if (followingListItems.length > 0) {
		const listType = parentList.getListType();

		const childNestedList = $getNestedListOfType(listItem, listType);

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

const $hasMovedSelectedAncestor = (
	node: LexicalNode,
	movedItems: Set<string>,
): boolean => {
	for (let parent = node.getParent(); parent; parent = parent.getParent()) {
		if ($isListItemNode(parent) && movedItems.has(parent.getKey())) return true;
	}
	return false;
};

/**
 * Applies nesting to selected list items. Returns whether a list item handled the key,
 * including when every selected item is at a nesting boundary.
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

	// Map preserves the item order returned by getNodes(), independent of selection direction.
	const listItems = Array.from(selectedItems.values());
	if (listItems.length === 0) return false;

	if (direction === 'increase') {
		const movedItems = new Set<string>();
		for (const item of listItems) {
			if ($hasMovedSelectedAncestor(item, movedItems)) continue;

			if ($increaseListItemNesting(item)) {
				movedItems.add(item.getKey());
			}
		}
	} else {
		// Outdent bottom-up so moving a parent does not shift a selected child first.
		for (const item of listItems.toReversed()) {
			$decreaseListItemNesting(item);
		}
	}

	return true;
};
