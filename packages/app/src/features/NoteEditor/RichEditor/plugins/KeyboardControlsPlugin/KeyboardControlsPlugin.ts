import { useEffect } from 'react';
import {
	$addUpdateTag,
	$createParagraphNode,
	$findMatchingParent,
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
	KEY_TAB_COMMAND,
} from 'lexical';
import { $isCodeNode } from '@lexical/code-core';
import {
	$createListNode,
	$isListItemNode,
	$isListNode,
	ListItemNode,
} from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isQuoteNode } from '@lexical/rich-text';
import { mergeRegister } from '@lexical/utils';

import { $applyMovePlan, $getMovePlan, MoveDirection } from './blockNavigation';

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

export const MOVE_BLOCKS_TAG = 'MOVE_BLOCKS_TAG';

const indentListItem = (listItem: ListItemNode) => {
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

	listItem.selectStart();
	return true;
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
					KEY_TAB_COMMAND,
					(event) => {
						const selection = $getSelection();
						if (!$isRangeSelection(selection)) return false;

						const listItem = $findMatchingParent(
							selection.anchor.getNode(),
							$isListItemNode,
						);
						if (!listItem) return false;

						event.preventDefault();
						return indentListItem(listItem);
					},
					COMMAND_PRIORITY_LOW,
				),
				editor.registerCommand(
					KEY_DOWN_COMMAND,
					(event) => {
						if (!((event.ctrlKey || event.metaKey) && event.key === ']'))
							return false;

						const selection = $getSelection();
						if (!$isRangeSelection(selection)) return false;

						const listItem = $findMatchingParent(
							selection.anchor.getNode(),
							$isListItemNode,
						);
						if (!listItem) return false;

						event.preventDefault();
						return indentListItem(listItem);
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

						const plan = $getMovePlan(selection, direction);
						if (!plan || !$applyMovePlan(plan, selection)) return false;

						event.preventDefault();
						$addUpdateTag(MOVE_BLOCKS_TAG);
						return true;
					},
					COMMAND_PRIORITY_HIGH,
				),

				// Keep the current selection visible
				editor.registerUpdateListener(({ editorState, tags }) => {
					if (!tags.has(MOVE_BLOCKS_TAG)) return;

					editorState.read(() => {
						const selection = $getSelection();
						if (!$isRangeSelection(selection)) return;

						const element = editor.getElementByKey(
							selection.focus.getNode().getKey(),
						);

						if (element && element.scrollIntoView)
							element.scrollIntoView({ block: 'nearest' });
					});
				}),
			),
		[editor],
	);

	return null;
};
