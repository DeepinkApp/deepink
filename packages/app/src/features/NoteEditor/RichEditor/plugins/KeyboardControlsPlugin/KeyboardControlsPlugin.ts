import { useEffect } from 'react';
import {
	$createParagraphNode,
	$findMatchingParent,
	$getSelection,
	$isElementNode,
	$isParagraphNode,
	$isRangeSelection,
	$isTextNode,
	BaseSelection,
	COMMAND_PRIORITY_LOW,
	createCommand,
	ElementNode,
	KEY_BACKSPACE_COMMAND,
	KEY_ENTER_COMMAND,
} from 'lexical';
import { $isCodeNode } from '@lexical/code-core';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isQuoteNode } from '@lexical/rich-text';
import { mergeRegister } from '@lexical/utils';

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
					KEY_BACKSPACE_COMMAND,
					(event) => {
						const selection = $getSelection();
						if (!$isRangeSelection(selection) || !selection.isCollapsed())
							return false;
						if (selection.anchor.offset !== 0) return false;

						// Handle Backspace at the beginning of a quote: unwrap the quote or remove it if it is empty
						const quoteNode = $findMatchingParent(
							selection.anchor.getNode(),
							$isQuoteNode,
						);
						if (!quoteNode) return false;

						// A quote can contain multiple lines, find the line containing the cursor
						// Continue unwrapping the quote only when the cursor is in its first line,
						// otherwise, let Lexical handle backspace
						const cursorLine = $findMatchingParent(
							selection.anchor.getNode(),
							(node) => node.getParent() === quoteNode,
						);
						if (cursorLine && cursorLine !== quoteNode.getFirstChild())
							return false;

						// Unwrap the quote, reducing its nesting level or removing it entirely
						const parent = quoteNode.getParent();
						if (!$isElementNode(parent)) return false;

						const children = quoteNode.getChildren();

						// Move the quote's children into its parent preserving their content
						if (children.length > 0) {
							const index = quoteNode.getIndexWithinParent();
							parent.splice(index, 1, children);
							children[0].selectStart();
						} else {
							// Remove empty quote
							quoteNode.remove();
							parent.selectEnd();
						}

						event.preventDefault();
						return true;
					},
					COMMAND_PRIORITY_LOW,
				),
			),
		[editor],
	);

	return null;
};
