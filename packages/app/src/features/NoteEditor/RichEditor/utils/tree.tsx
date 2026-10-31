import {
	$createParagraphNode,
	$getRoot,
	$getSelection,
	$hasAncestor,
	$isBlockElementNode,
	$isRangeSelection,
	$isRootNode,
	$isTextNode,
	ElementNode,
	LexicalNode,
} from 'lexical';
import { $isCodeNode } from '@lexical/code-core';
import { $findMatchingParent } from '@lexical/utils';

export const $canInsertElementsToNode = (node: LexicalNode) => {
	if ($isTextNode(node)) return false;

	// Check for parents
	let currentNode: LexicalNode | null = node;
	while (currentNode !== null) {
		if ($isCodeNode(currentNode)) return false;
		currentNode = currentNode.getParent();
	}

	return true;
};

export const $findCommonAncestor = (
	startNode: LexicalNode,
	nodes: LexicalNode[],
	filter: (node: LexicalNode) => boolean = () => true,
) => {
	if (nodes.length === 1 && startNode.is(nodes[0]) && filter(startNode)) {
		return startNode;
	}

	return $findMatchingParent(startNode, (parent) => {
		return (
			nodes.every((selectedNode) => $hasAncestor(selectedNode, parent)) &&
			$canInsertElementsToNode(parent)
		);
	});
};

export const $wrapNodes = (createElement: (nodes: LexicalNode[]) => ElementNode) => {
	const selection = $getSelection();

	const points = selection?.getStartEndPoints();
	if (!selection || !points) return;

	const [start, end] = points;

	if (
		$isRangeSelection(selection) &&
		(start.getNode() !== end.getNode() || start.offset !== end.offset)
	) {
		const selectedNodes = selection.getNodes();
		const anchorNode = selection.anchor.getNode();
		const commonAncestor =
			$findMatchingParent(
				anchorNode,
				(parent) =>
					selectedNodes.every((selectedNode) =>
						$hasAncestor(selectedNode, parent),
					) && $canInsertElementsToNode(parent),
			) ?? $getRoot();
		if (!commonAncestor || !$isBlockElementNode(commonAncestor)) return;

		// In case common ancestor is not direct parent of any node,
		// current implementation will drop that case and will not wrap such selection.
		// Otherwise, we would have to ensure nodes integrity
		const firstChildNode = commonAncestor
			.getChildren()
			.find((children) => selectedNodes.includes(children));
		if (!firstChildNode) return;

		const tmpNode = $createParagraphNode();
		firstChildNode.insertBefore(tmpNode);

		const topSelectedNodes = selectedNodes.filter((node) =>
			commonAncestor.is(node.getParent()),
		);

		tmpNode.replace(createElement(topSelectedNodes));

		return;
	}

	const anchor = start.getNode();
	if ($isRootNode(anchor)) {
		// Handle case with empty editor state
		const paragraph = $createParagraphNode();
		anchor.append(paragraph);
		paragraph.append(createElement([]));
	} else {
		const blockElement = $findMatchingParent(
			anchor,
			(node) => $isBlockElementNode(node) && !node.isParentRequired(),
		) as ElementNode | null;

		if (!blockElement) return;

		const tmpNode = $createParagraphNode();
		blockElement.replace(tmpNode);
		tmpNode.replace(createElement([blockElement]));
	}
};
/**
 * Search up to tree for nearest sibling node
 *
 * Sibling node is a node beside the one may be placed another node.
 *
 * For example, text node inside code node is not a sibling, since code node may contain only one text node,
 * so for that case we have to continue search, to find other node that will have parent that allow contains another nodes.
 */

export const $getNearestSibling = (startNode: LexicalNode) => {
	const parent = startNode.getParent();

	// Special case if parent node is root
	if (!parent) return startNode.isAttached() ? startNode : null;

	if ($canInsertElementsToNode(parent)) return startNode;

	const parents = startNode.getParents();
	for (let i = 0; i < parents.length; i++) {
		const target = parents[i];
		const parent = parents[i + 1] ?? $getRoot();

		if ($canInsertElementsToNode(parent)) {
			return target;
		}
	}

	return null;
};
