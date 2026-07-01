import { useEffect } from 'react';
import {
	$createParagraphNode,
	$createTextNode,
	$getSelection,
	$isParagraphNode,
	$isTextNode,
	BaseSelection,
	COMMAND_PRIORITY_LOW,
	createCommand,
	ElementNode,
	KEY_ENTER_COMMAND,
	KEY_SPACE_COMMAND,
} from 'lexical';
import { $isCodeNode } from '@lexical/code';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isQuoteNode } from '@lexical/rich-text';
import { mergeRegister } from '@lexical/utils';

import { $isFormattingNode, FormattingNode } from '../Markdown/nodes/FormattingNode';

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

export const FormattingPlugin = () => {
	const [editor] = useLexicalComposerContext();

	useEffect(
		() =>
			mergeRegister(
				// editor.registerNodeTransform(TextNode, $convertTextNodeFormatting),
				editor.registerNodeTransform(FormattingNode, (node: FormattingNode) => {
					// Remove empty formatting nodes
					const textContent = node.getTextContent();
					if (textContent.length > 0) return;

					node.remove();
				}),
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
					KEY_SPACE_COMMAND,
					(event) => {
						// Out of inline nodes by Shift+Space
						if (!event.shiftKey) return false;

						const selection = $getSelection();
						if (!selection) return false;

						const points = selection.getStartEndPoints();
						if (!points) return false;

						const [start, end] = points;

						if (
							start.getNode() !== end.getNode() ||
							start.offset !== end.offset
						)
							return false;

						const focusedNode = end.getNode();
						if (!$isTextNode(focusedNode)) return false;

						const parent = focusedNode.getParent();
						if (
							!parent ||
							!$isFormattingNode(parent) ||
							parent.getLastChild() !== focusedNode
						)
							return false;

						if (end.offset !== focusedNode.getTextContentSize()) return false;

						const textNode = $createTextNode(' ');
						parent.insertAfter(textNode);
						textNode.select();

						event.stopImmediatePropagation();
						event.stopPropagation();
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
