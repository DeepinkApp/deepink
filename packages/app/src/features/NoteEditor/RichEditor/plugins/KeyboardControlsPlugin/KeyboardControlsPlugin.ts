import { useEffect } from 'react';
import {
	$createParagraphNode,
	$getSelection,
	$isParagraphNode,
	$isRangeSelection,
	$isTextNode,
	BaseSelection,
	COMMAND_PRIORITY_HIGH,
	COMMAND_PRIORITY_LOW,
	createCommand,
	ElementNode,
	KEY_DOWN_COMMAND,
	KEY_ENTER_COMMAND,
} from 'lexical';
import { $isCodeNode } from '@lexical/code-core';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isQuoteNode } from '@lexical/rich-text';
import { mergeRegister } from '@lexical/utils';

import { $getBlocksToMove, $getMoveTarget, MoveDirection } from './blockNavigation';

const OUT_OF_BLOCK_NODE_COMMAND = createCommand<ElementNode>();

/**
 * Returns parent of paragraph found by cursor in selection.
 * Range selection will be ignored.
 *
 * @param selection
 * @returns
 */
const $getParentOfTextOnEnd = (selection: BaseSelection | null) => {
	if (!selection) return;

	const points = selection.getStartEndPoints();
	if (!points) return;

	const [start, end] = points;

	if (start.getNode() !== end.getNode() || start.offset !== end.offset) return;

	const focusedNode = end.getNode();

	if ($isParagraphNode(focusedNode)) {
		return focusedNode.isLastChild() ? focusedNode.getParent() : null;
	}

	if ($isTextNode(focusedNode)) {
		const parent = focusedNode.getParent();
		if (!parent || parent.getLastChild() !== focusedNode) return;

		if ($isParagraphNode(parent)) {
			return parent.isLastChild() ? parent.getParent() : null;
		}

		return parent;
	}

	return null;
};

/**
 * Plugin for nodes management via keyboard
 */
export const KeyboardControlsPlugin = () => {
	const [editor] = useLexicalComposerContext();

	useEffect(
		() =>
			mergeRegister(
				editor.registerCommand(
					KEY_ENTER_COMMAND,
					(event) => {
						// Out of code and quote nodes by Ctrl+Enter
						if (!event || !event.ctrlKey) return false;

						const blockElement = $getParentOfTextOnEnd($getSelection());

						if ($isCodeNode(blockElement) || $isQuoteNode(blockElement)) {
							return editor.dispatchCommand(
								OUT_OF_BLOCK_NODE_COMMAND,
								blockElement,
							);
						}

						return false;
					},
					COMMAND_PRIORITY_LOW,
				),
				editor.registerCommand(
					OUT_OF_BLOCK_NODE_COMMAND,
					(blockElement) => {
						// Out of block node
						const newParagraph = $createParagraphNode();
						blockElement.insertAfter(newParagraph);
						newParagraph.select();

						return true;
					},
					COMMAND_PRIORITY_LOW,
				),
				editor.registerCommand(
					KEY_DOWN_COMMAND,
					(event) => {
						if (
							(event.key !== 'ArrowUp' && event.key !== 'ArrowDown') ||
							!event.altKey
						)
							return false;

						const selection = $getSelection();
						if (!$isRangeSelection(selection)) return false;

						const direction: MoveDirection =
							event.key === 'ArrowUp' ? 'up' : 'down';

						const blocksToMove = $getBlocksToMove(selection, direction);
						if (!blocksToMove?.length) return false;

						if (direction === 'up') {
							const previousBlock = $getMoveTarget(blocksToMove[0], 'up');
							if (!previousBlock) return false;

							blocksToMove.forEach((block) => {
								previousBlock.insertBefore(block);
							});
						} else {
							const nextBlock = $getMoveTarget(
								blocksToMove[blocksToMove.length - 1],
								'down',
							);
							if (!nextBlock) return false;

							blocksToMove.toReversed().forEach((block) => {
								nextBlock.insertAfter(block);
							});
						}

						event.preventDefault();
						return true;
					},
					COMMAND_PRIORITY_HIGH,
				),
			),
		[editor],
	);

	return null;
};
