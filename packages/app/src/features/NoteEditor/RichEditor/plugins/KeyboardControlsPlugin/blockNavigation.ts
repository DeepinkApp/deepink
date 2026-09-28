import {
	$isElementNode,
	$isRootNode,
	ElementNode,
	LexicalNode,
	NodeKey,
	RangeSelection,
} from 'lexical';
import {
	$createListNode,
	$isListItemNode,
	$isListNode,
	ListItemNode,
	ListNode,
	type ListType,
} from '@lexical/list';

import { $getCompatibleNestedList } from './listNestingUtils';

export type MoveDirection = 'up' | 'down';

type MoveDestination =
	| { type: 'before' | 'after'; reference: LexicalNode }
	| { type: 'append'; parent: ElementNode }
	| { type: 'append-list'; parent: ListItemNode; listType: ListType };

type MovementUnit = {
	nodes: LexicalNode[];
	parent: ElementNode;
};

export type MovePlan = {
	unit: MovementUnit;
	destination: MoveDestination;
};

type SelectionPoint = {
	key: NodeKey;
	offset: number;
	type: 'text' | 'element';
};

export type SelectionSnapshot = {
	anchor: SelectionPoint;
	focus: SelectionPoint;
};

const $getAncestors = (node: LexicalNode) => {
	const ancestors: LexicalNode[] = [];
	for (let current: LexicalNode | null = node; current; current = current.getParent()) {
		ancestors.push(current);
	}
	return ancestors;
};

const $getCommonAncestor = (first: LexicalNode, second: LexicalNode) => {
	const ancestors = new Set($getAncestors(first));
	for (
		let current: LexicalNode | null = second;
		current;
		current = current.getParent()
	) {
		if (ancestors.has(current)) return current;
	}
	return null;
};

const $getDirectChild = (node: LexicalNode, ancestor: LexicalNode) => {
	let current = node;
	while (current.getParent() && current.getParent() !== ancestor) {
		current = current.getParent()!;
	}
	return current.getParent() === ancestor ? current : null;
};

const $getSibling = (node: LexicalNode, direction: MoveDirection) =>
	direction === 'up' ? node.getPreviousSibling() : node.getNextSibling();

const $getBlock = (node: LexicalNode) => {
	let current = node;
	while (current.getParent()) {
		const parent = current.getParent()!;
		if ($isElementNode(current) && !current.isInline() && $isElementNode(parent)) {
			return current;
		}
		current = parent;
	}
	return null;
};

const $getSiblingRange = (parent: ElementNode, first: LexicalNode, last: LexicalNode) => {
	const children = parent.getChildren();
	const start = children.indexOf(first);
	const end = children.indexOf(last);
	if (start < 0 || end < 0) return null;
	return children.slice(Math.min(start, end), Math.max(start, end) + 1);
};

const $getSelectionSnapshot = (selection: RangeSelection): SelectionSnapshot => ({
	anchor: {
		key: selection.anchor.key,
		offset: selection.anchor.offset,
		type: selection.anchor.type,
	},
	focus: {
		key: selection.focus.key,
		offset: selection.focus.offset,
		type: selection.focus.type,
	},
});

const $restoreMoveSelection = (
	selection: RangeSelection,
	snapshot: SelectionSnapshot,
) => {
	selection.anchor.set(
		snapshot.anchor.key,
		snapshot.anchor.offset,
		snapshot.anchor.type,
	);
	selection.focus.set(snapshot.focus.key, snapshot.focus.offset, snapshot.focus.type);
};

const $getListItem = (node: LexicalNode) => {
	for (let current: LexicalNode | null = node; current; current = current.getParent()) {
		if ($isListItemNode(current)) return current;
	}
	return null;
};

const $isDescendantOf = (node: LexicalNode, ancestor: LexicalNode) => {
	for (
		let current: LexicalNode | null = node.getParent();
		current;
		current = current.getParent()
	) {
		if (current === ancestor) return true;
	}
	return false;
};

const $getListInsertion = (list: ListNode, direction: MoveDirection): MoveDestination => {
	const first = list.getFirstChild();
	const last = list.getLastChild();

	if (direction === 'up' && last) return { type: 'after', reference: last };
	if (direction === 'down' && first) return { type: 'before', reference: first };
	return { type: 'append', parent: list };
};

const $createMovementUnit = (
	nodes: LexicalNode[],
	parent: ElementNode,
): MovementUnit => ({ nodes, parent });

const $cleanupEmptyAncestors = (container: ElementNode) => {
	let current: ElementNode | null = container;
	while (current && current.getChildrenSize() === 0) {
		const parent: LexicalNode | null = current.getParent();
		if (!$isElementNode(parent) || $isRootNode(current)) return;
		current.remove();
		current = parent;
	}
};

const $getNestedListPlan = (
	selection: RangeSelection,
	direction: MoveDirection,
): MovePlan | null => {
	if (!selection.isCollapsed()) return null;

	const item = $getListItem(selection.anchor.getNode());
	if (!item) return null;

	const itemParent = item.getParent();
	if (!$isListNode(itemParent)) return null;

	let list: ListNode = itemParent;

	const sibling = $getSibling(item, direction);
	if (sibling) {
		return {
			unit: $createMovementUnit([item], list),
			destination: {
				type: direction === 'up' ? 'before' : 'after',
				reference: sibling,
			},
		};
	}

	while (true) {
		const listParent = list.getParent();
		const owner: ListItemNode | null = $isListItemNode(listParent)
			? listParent
			: null;
		if (!owner) {
			const siblingList = $getSibling(list, direction);
			if (siblingList) {
				const listParent = list.getParent();
				if (!$isElementNode(listParent)) return null;
				return {
					unit: $createMovementUnit([list], listParent),
					destination: {
						type: direction === 'up' ? 'before' : 'after',
						reference: siblingList,
					},
				};
			}

			if (!$isListItemNode(listParent)) return null;
			const promotedParent = listParent.getParent();
			if (!$isListNode(promotedParent)) return null;
			list = promotedParent;
			continue;
		}

		const ownerSibling = $getSibling(owner, direction);
		if ($isListItemNode(ownerSibling)) {
			const targetList = $getCompatibleNestedList(ownerSibling, item);
			if (targetList) {
				return {
					unit: $createMovementUnit([item], list),
					destination: $getListInsertion(targetList, direction),
				};
			}

			return {
				unit: $createMovementUnit([item], list),
				destination: {
					type: 'append-list',
					parent: ownerSibling,
					listType: list.getListType(),
				},
			};
		}

		const ownerParent = owner.getParent();
		if (!$isListNode(ownerParent)) return null;
		list = ownerParent;
	}
};

const $getStructuralPlan = (
	selection: RangeSelection,
	direction: MoveDirection,
): MovePlan | null => {
	const firstBlock = $getBlock(selection.anchor.getNode());
	const lastBlock = $getBlock(selection.focus.getNode());
	if (!firstBlock || !lastBlock) return null;

	let container =
		firstBlock === lastBlock
			? firstBlock.getParent()
			: $getCommonAncestor(firstBlock, lastBlock);
	if (!$isElementNode(container)) return null;

	let first = firstBlock;
	let last = lastBlock;

	while (true) {
		const firstChild = $getDirectChild(first, container);
		const lastChild = $getDirectChild(last, container);
		if (!firstChild || !lastChild) return null;

		const nodes = $getSiblingRange(container, firstChild, lastChild);
		if (!nodes?.length) return null;

		const sibling =
			direction === 'up'
				? nodes[0].getPreviousSibling()
				: nodes[nodes.length - 1].getNextSibling();

		if (sibling) {
			return {
				unit: $createMovementUnit(nodes, container),
				destination: {
					type: direction === 'up' ? 'before' : 'after',
					reference: sibling,
				},
			};
		}

		if ($isRootNode(container)) return null;
		first = container;
		last = container;
		container = container.getParent();
		if (!$isElementNode(container)) return null;
	}
};

export const $getMovePlan = (
	selection: RangeSelection,
	direction: MoveDirection,
): MovePlan | null =>
	$getNestedListPlan(selection, direction) ?? $getStructuralPlan(selection, direction);

export const $applyMovePlan = (plan: MovePlan, selection: RangeSelection) => {
	const snapshot = $getSelectionSnapshot(selection);
	const { unit, destination } = plan;
	const { nodes } = unit;
	let parent: ElementNode;
	let reference: LexicalNode | null = null;

	if (destination.type === 'append-list') {
		if (
			nodes.some(
				(node) =>
					node === destination.parent ||
					$isDescendantOf(destination.parent, node),
			)
		) {
			return false;
		}
		const list = $createListNode(destination.listType);
		destination.parent.append(list);
		parent = list;
	} else if (destination.type === 'append') {
		parent = destination.parent;
	} else {
		const destinationReference = destination.reference;
		if (
			nodes.some(
				(node) =>
					node === destinationReference ||
					$isDescendantOf(destinationReference, node),
			)
		) {
			return false;
		}
		reference = destinationReference;
		const destinationParent = destinationReference.getParent();
		if (!$isElementNode(destinationParent)) return false;
		parent = destinationParent;
	}

	for (const node of nodes) node.remove();

	if (reference) {
		if (destination.type === 'before') {
			for (const node of nodes) reference.insertBefore(node);
		} else {
			for (const node of nodes.toReversed()) reference.insertAfter(node);
		}
	} else {
		parent.append(...nodes);
	}

	if (unit.parent !== parent) $cleanupEmptyAncestors(unit.parent);
	$restoreMoveSelection(selection, snapshot);
	return true;
};
