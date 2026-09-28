import {
	$isListNode,
	type ListItemNode,
	type ListNode,
	type ListType,
} from '@lexical/list';

export const $getNestedListOfType = (
	listItem: ListItemNode,
	listType: ListType,
): ListNode | null =>
	listItem
		.getChildren()
		.find(
			(child): child is ListNode =>
				$isListNode(child) && child.getListType() === listType,
		) ?? null;

export const $getCompatibleNestedList = (
	listItem: ListItemNode,
	sourceListItem: ListItemNode,
): ListNode | null => {
	const sourceList = sourceListItem.getParent();
	if (!$isListNode(sourceList)) return null;

	return $getNestedListOfType(listItem, sourceList.getListType());
};
