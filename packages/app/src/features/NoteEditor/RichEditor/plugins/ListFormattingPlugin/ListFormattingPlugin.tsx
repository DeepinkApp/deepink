import { useEffect } from 'react';
import {
	$createParagraphNode,
	$findMatchingParent,
	$getSelection,
	$isRangeSelection,
	$isRootNode,
	COMMAND_PRIORITY_BEFORE_LOW,
} from 'lexical';
import {
	$isListNode,
	INSERT_CHECK_LIST_COMMAND,
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
	ListNode,
} from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';

import { $getCursorNode } from '../../utils/selection';

import { $convertListToLines } from './$convertListToLines';

const listTypeMap = {
	checkbox: 'check',
	ordered: 'number',
	unordered: 'bullet',
} as const;

type ListType = (typeof listTypeMap)[keyof typeof listTypeMap];

const $tryConvertListToLines = (requestedType: ListType) => {
	const selection = $getSelection();
	if (!$isRangeSelection(selection)) return false;

	const listNodes = new Set<ListNode>();
	selection.getNodes().forEach((node) => {
		const list = $findMatchingParent(node, $isListNode);
		if (list) listNodes.add(list);
	});

	if (
		listNodes.size === 0 ||
		!Array.from(listNodes).every((list) => list.getListType() === requestedType)
	)
		return false;

	const targetLists = Array.from(listNodes).filter((list) => {
		for (let ancestor = list.getParent(); ancestor; ancestor = ancestor.getParent()) {
			if ($isListNode(ancestor) && listNodes.has(ancestor)) return false;
		}
		return true;
	});

	targetLists.forEach($convertListToLines);
	return true;
};

const $ensureEditorNotEmpty = () => {
	const target = $getCursorNode();
	if (!$isRootNode(target) || target.getChildrenSize() > 0) return;

	const paragraph = $createParagraphNode();
	target.append(paragraph);
	paragraph.select();
};

const $handleListCommand = (requestedType: ListType) => {
	if ($tryConvertListToLines(requestedType)) return true;

	// Ensure the built-in list command has a block to transform in an empty editor.
	$ensureEditorNotEmpty();
	return false;
};

/**
 * Intercepts list insertion commands to toggle an already-matching list back into lines.
 */
export const ListFormattingPlugin = () => {
	const [editor] = useLexicalComposerContext();

	useEffect(
		() =>
			mergeRegister(
				editor.registerCommand(
					INSERT_CHECK_LIST_COMMAND,
					() => $handleListCommand(listTypeMap.checkbox),
					COMMAND_PRIORITY_BEFORE_LOW,
				),
				editor.registerCommand(
					INSERT_ORDERED_LIST_COMMAND,
					() => $handleListCommand(listTypeMap.ordered),
					COMMAND_PRIORITY_BEFORE_LOW,
				),
				editor.registerCommand(
					INSERT_UNORDERED_LIST_COMMAND,
					() => $handleListCommand(listTypeMap.unordered),
					COMMAND_PRIORITY_BEFORE_LOW,
				),
			),
		[editor],
	);

	return null;
};
