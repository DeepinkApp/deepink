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

export type MoveDirection = 'up' | 'down';

type MoveDestination =
	| { type: 'before' | 'after'; reference: LexicalNode }
	| { type: 'append'; parent: ElementNode };

export type MovePlan = {
	nodes: LexicalNode[];
	destination: MoveDestination;
	cleanup?: ElementNode;
	createListType?: ListType;
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

const $getCompatibleList = (
	item: ListItemNode,
	source: ListItemNode,
): ListNode | null => {
	const sourceList = source.getParent();
	if (!$isListNode(sourceList)) return null;

	return (
		item
			.getChildren()
			.find(
				(child): child is ListNode =>
					$isListNode(child) &&
					child.getListType() === sourceList.getListType(),
			) ?? null
	);
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
			nodes: [item],
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
				return {
					nodes: [list],
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
			const targetList = $getCompatibleList(ownerSibling, item);
			if (targetList) {
				const first = targetList.getFirstChild();
				const last = targetList.getLastChild();
				return {
					nodes: [item],
					destination:
						direction === 'up' && last
							? { type: 'after', reference: last }
							: direction === 'down' && first
								? { type: 'before', reference: first }
								: { type: 'append', parent: targetList },
					cleanup: list,
				};
			}

			return {
				nodes: [item],
				destination: { type: 'append', parent: ownerSibling },
				cleanup: list,
				createListType: list.getListType(),
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
				nodes,
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
	let parent: ElementNode;
	let reference: LexicalNode | null = null;

	if (plan.createListType) {
		if (plan.destination.type !== 'append') return false;
		const list = $createListNode(plan.createListType);
		plan.destination.parent.append(list);
		parent = list;
	} else if (plan.destination.type === 'append') {
		parent = plan.destination.parent;
	} else {
		reference = plan.destination.reference;
		const destinationParent = reference.getParent();
		if (!$isElementNode(destinationParent)) return false;
		parent = destinationParent;
	}

	for (const node of plan.nodes) node.remove();

	if (reference) {
		if (plan.destination.type === 'before') {
			for (const node of plan.nodes) reference.insertBefore(node);
		} else {
			for (const node of plan.nodes.toReversed()) reference.insertAfter(node);
		}
	} else {
		parent.append(...plan.nodes);
	}

	if (plan.cleanup && plan.cleanup.getChildrenSize() === 0) plan.cleanup.remove();
	$restoreMoveSelection(selection, snapshot);
	return true;
};
