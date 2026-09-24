import {
	$findMatchingParent,
	$isElementNode,
	$isRootNode,
	LexicalNode,
	RangeSelection,
} from 'lexical';
import { $isListItemNode, $isListNode } from '@lexical/list';
import { $isQuoteNode } from '@lexical/rich-text';

export type MoveDirection = 'up' | 'down';

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
