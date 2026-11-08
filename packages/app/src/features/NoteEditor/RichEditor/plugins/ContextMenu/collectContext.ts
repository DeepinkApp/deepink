import { $getSelection, $isInlineFormattable, LexicalNode } from 'lexical';
import { $isCodeNode } from '@lexical/code-core';
import { $isLinkNode } from '@lexical/link';
import { $isListNode } from '@lexical/list';
import { $isHeadingNode, $isQuoteNode } from '@lexical/rich-text';
import { $findMatchingParent } from '@lexical/utils';

import { $isImageNode } from '../Image/ImageNode';
import { ContextMenuContext } from './types';

export const $collectContextMenuContext = (
	targetNode: LexicalNode,
): ContextMenuContext => {
	const selection = $getSelection();
	const linkNode = $findMatchingParent(targetNode, $isLinkNode);
	const imageNode = $findMatchingParent(targetNode, $isImageNode);
	const codeNode = $findMatchingParent(targetNode, $isCodeNode);
	const listNode = $findMatchingParent(targetNode, $isListNode);
	const selectedText = selection?.getTextContent() ?? '';
	const selectedNodes = selection?.getNodes() ?? [];

	return {
		targetKey: targetNode.getKey(),
		selection: selection?.clone() ?? null,
		selectedText,
		link: linkNode
			? {
					key: linkNode.getKey(),
					url: linkNode.getURL(),
					title: linkNode.getTitle() ?? '',
				}
			: null,
		image: imageNode
			? {
					key: imageNode.getKey(),
					url: imageNode.getSrc(),
					altText: imageNode.getAltText(),
				}
			: null,
		codeBlock: codeNode
			? {
					key: codeNode.getKey(),
					language: codeNode.getLanguage()?.toLowerCase() ?? null,
				}
			: null,
		listType: listNode ? listNode.getListType() : null,
		headingTag: $findMatchingParent(targetNode, $isHeadingNode)?.getTag() ?? null,
		isQuote: Boolean($findMatchingParent(targetNode, $isQuoteNode)),
		canFormatSelection:
			selectedText.length > 0 &&
			selectedNodes.some(
				(node) =>
					$findMatchingParent(node, $isInlineFormattable) &&
					!$findMatchingParent(node, $isCodeNode),
			),
	};
};
