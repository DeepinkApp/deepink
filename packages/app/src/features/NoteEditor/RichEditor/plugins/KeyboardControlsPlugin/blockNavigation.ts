import {
	$findMatchingParent,
	$isElementNode,
	$isRootNode,
	ElementNode,
	LexicalNode,
	RangeSelection,
} from 'lexical';
import {
	$createListNode,
	$isListItemNode,
	$isListNode,
	type ListType,
} from '@lexical/list';
import { $isQuoteNode } from '@lexical/rich-text';

export type MoveDirection = 'up' | 'down';

export type MoveLocation = {
	parent: ElementNode;
	index: number;
};

export type MovePlan = {
	nodes: LexicalNode[];
	location: MoveLocation;
	cleanup?: ElementNode;
	createListType?: ListType;
};

/**
 * Checks whether a node is a wrapper for a nested list.
 *
 * A ListItemNode is a wrapper when its only child is a ListNode.
 * Such wrappers should not be used as standalone move targets
 */
const $isNestedListWrapper = (node: LexicalNode | null) => {
	if (!$isListItemNode(node)) return false;
	const children = node.getChildren();
	return children.length === 1 && $isListNode(children[0]);
};

/**
 * Finds the movable sibling in the given direction.
 *
 * Skips nested-list wrappers so they are never selected as standalone
 * move targets.
 */
const $getMovableSibling = (node: LexicalNode, direction: MoveDirection) => {
	const sibling =
		direction === 'up' ? node.getPreviousSibling() : node.getNextSibling();
	if (!sibling || !$isNestedListWrapper(sibling)) return sibling;

	return direction === 'up' ? sibling.getPreviousSibling() : sibling.getNextSibling();
};

/**
 * Finds the target node for moving in the given direction.
 *
 * Walks up through parent nodes when the current node has no movable sibling.
 * Includes an attached nested list wrapper when moving down.
 */
export const $getMoveTarget = (
	node: LexicalNode,
	direction: MoveDirection,
): LexicalNode | null => {
	const sibling = $getMovableSibling(node, direction);

	if (!sibling) {
		const parent = node.getParent();
		return parent && !$isRootNode(parent) ? $getMoveTarget(parent, direction) : null;
	}

	// When moving down, include the nested list if it is attached to the adjacent block
	if (direction === 'down') {
		const next = sibling.getNextSibling();
		if ($isNestedListWrapper(next)) return next;
	}

	return sibling;
};

/**
 * Finds the nearest movable block for the node
 */
const $findBlockToMove = (
	node: LexicalNode,
	direction: MoveDirection,
): LexicalNode | null => {
	if (!$isElementNode(node) || node.isInline()) {
		const parent = node.getParent();
		return parent ? $findBlockToMove(parent, direction) : null;
	}

	// Normal block movement within the current container
	if ($getMovableSibling(node, direction)) {
		return node;
	}

	// If this block is inside a top-level quote, move the whole quote
	const parent = node.getParent();
	if ($isQuoteNode(parent) && $isRootNode(parent.getParent())) {
		return $getMovableSibling(parent, direction) ? parent : null;
	}

	return null;
};

const $hasMovableAncestor = (node: LexicalNode, movableNodes: Set<LexicalNode>) => {
	const parent = node.getParent();
	if (!parent) return false;
	if (movableNodes.has(parent)) return true;

	return $hasMovableAncestor(parent, movableNodes);
};

const $getListItem = (node: LexicalNode | null) => {
	let current = node;
	while (current && !$isListItemNode(current)) current = current.getParent();
	return current && $isListItemNode(current) ? current : null;
};

const $getSibling = (node: LexicalNode, direction: MoveDirection) =>
	direction === 'up' ? node.getPreviousSibling() : node.getNextSibling();

const $getIndex = (node: LexicalNode, parent: ElementNode) =>
	parent.getChildren().indexOf(node);

const $getCompatibleNestedList = (listItem: LexicalNode, sourceList: LexicalNode) => {
	const sourceType = $isListNode(sourceList) ? sourceList.getListType() : null;
	return listItem
		.getChildren()
		.find((child) => $isListNode(child) && child.getListType() === sourceType);
};

const $getRootListPlan = (
	list: ElementNode,
	direction: MoveDirection,
): MovePlan | null => {
	const parent = list.getParent();
	if (!$isElementNode(parent)) return null;

	const sibling = $getSibling(list, direction);
	if (!sibling) return null;

	const index = $getIndex(list, parent);
	return {
		nodes: [list],
		location: {
			parent,
			index: direction === 'up' ? index - 1 : index + 1,
		},
	};
};

/**
 * Resolves movement for a collapsed cursor in a list item.
 *
 * An item moves within its list whenever possible. At a nested-list edge,
 * only that item is moved into the adjacent parent item. At a root-list edge,
 * the containing list moves as one block.
 */
export const $getListItemMovePlan = (
	selection: RangeSelection,
	direction: MoveDirection,
): MovePlan | null => {
	if (!selection.isCollapsed()) return null;

	const item = $getListItem(selection.anchor.getNode());
	if (!item) return null;

	let list = item.getParent();
	if (!$isListNode(list)) return null;

	const sibling = $getSibling(item, direction);
	if (sibling) {
		const parent = list;
		const index = $getIndex(item, parent);
		return {
			nodes: [item],
			location: {
				parent,
				index: direction === 'up' ? index - 1 : index + 1,
			},
		};
	}

	while (true) {
		const owner = $isListItemNode(list.getParent()) ? list.getParent() : null;
		if (!owner) return $getRootListPlan(list, direction);

		const ownerList = owner.getParent();
		if (!$isListNode(ownerList)) return null;

		const adjacentOwner = $getSibling(owner, direction);
		if (adjacentOwner && $isListItemNode(adjacentOwner)) {
			const targetList = $getCompatibleNestedList(adjacentOwner, list);

			return {
				nodes: [item],
				location: {
					parent: targetList ?? adjacentOwner,
					index: targetList
						? direction === 'up'
							? targetList.getChildrenSize()
							: 0
						: adjacentOwner.getChildrenSize(),
				},
				cleanup: list,
				createListType: targetList ? undefined : list.getListType(),
			};
		}

		list = ownerList;
	}
};

export const $applyMovePlan = (plan: MovePlan) => {
	const { nodes, location, cleanup, createListType } = plan;
	let parent = location.parent;
	let index = location.index;

	if (createListType) {
		const list = $createListNode(createListType);
		parent.append(list);
		parent = list;
		index = 0;
	}

	const movingNodes = new Set(nodes);
	nodes.forEach((node) => node.remove());

	const reference = parent.getChildren()[index];
	if (reference && !movingNodes.has(reference)) {
		nodes.forEach((node) => reference.insertBefore(node));
	} else {
		parent.append(...nodes);
	}

	if (cleanup && cleanup.getChildrenSize() === 0) cleanup.remove();
	return true;
};

export const $getBlocksToMove = (selection: RangeSelection, direction: MoveDirection) => {
	const selectedNodes = selection.getNodes();
	const selectedSet = new Set(selectedNodes);

	const findMoveContainer = (node: LexicalNode) =>
		$findMatchingParent(node, (node) => $isListNode(node) || $isQuoteNode(node));

	// Any container whose entire content is covered by the selection moves as
	// one atomic unit — regardless of type or how deep it is nested
	const fullySelectedContainers = new Set<LexicalNode>();
	for (const node of selectedNodes) {
		const container = findMoveContainer(node);
		if (!$isElementNode(container)) continue;

		const children = container.getChildren();
		const isFullySelected =
			children.length > 0 && children.every((child) => selectedSet.has(child));

		if (isFullySelected) {
			// Reject moves targeting only a nested list to prevent detaching it from its
			const parent = container.getParent();
			if (parent && $isNestedListWrapper(parent) && !selectedSet.has(parent)) {
				return null;
			}

			fullySelectedContainers.add(container);
		}
	}

	const blocks = selectedNodes.map((node) => {
		const container = findMoveContainer(node);
		if (container && fullySelectedContainers.has(container)) {
			return container;
		}
		return $findBlockToMove(node, direction);
	});

	if (!blocks.every((block) => block !== null)) return null;

	const movableBlocks = new Set(blocks);
	return (
		Array.from(movableBlocks)
			// Drop blocks already covered by a movable ancestor to avoid duplicates
			.filter((node) => !$hasMovableAncestor(node, movableBlocks))
			.flatMap((block) => {
				const next = block.getNextSibling();
				const nestedList = $isNestedListWrapper(next) ? next : null;

				return nestedList ? [block, nestedList] : [block];
			})
	);
};
