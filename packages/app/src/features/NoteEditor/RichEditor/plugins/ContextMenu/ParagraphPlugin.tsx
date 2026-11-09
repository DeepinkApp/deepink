import { useEffect } from 'react';
import {
	$createParagraphNode,
	$getSelection,
	$isElementNode,
	$isParagraphNode,
	$isRangeSelection,
	$isRootOrShadowRoot,
	COMMAND_PRIORITY_LOW,
	createCommand,
	type ElementNode,
	type LexicalNode,
	type NodeKey,
} from 'lexical';
import { $isListItemNode, REMOVE_LIST_COMMAND } from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

export const CONVERT_TO_PARAGRAPH_COMMAND = createCommand<void>('CONVERT_TO_PARAGRAPH');

const $isBlock = (n: LexicalNode): n is ElementNode => $isElementNode(n) && !n.isInline();
const $isContainer = (n: ElementNode) => n.getChildren().some($isBlock);

// nearest block: the one holding the text, or the container itself
function $blockOf(node: LexicalNode): ElementNode | null {
	let n: LexicalNode | null = node;
	while (n && !$isBlock(n)) n = n.getParent();
	return n;
}

// replace a container with its children
function $unwrap(container: ElementNode) {
	for (const child of container.getChildren()) container.insertBefore(child);
	container.remove();
}

function $toParagraph(block: ElementNode) {
	const p = $createParagraphNode();
	p.setFormat(block.getFormatType());
	p.setIndent(block.getIndent());
	p.setDirection(block.getDirection());
	block.replace(p, true); // true = keep children
}

// converts exactly one level
function $convertBlock(block: ElementNode) {
	if ($isRootOrShadowRoot(block)) return;
	if ($isContainer(block)) return $unwrap(block); // quote that holds blocks
	if (!$isParagraphNode(block)) return $toParagraph(block); // heading, code, leaf quote
	const parent = block.getParent(); // paragraph: drop its wrapper
	if (parent && !$isRootOrShadowRoot(parent)) $unwrap(parent);
}

function $commonAncestor(a: ElementNode, b: ElementNode): ElementNode | null {
	const ancestors = new Set<NodeKey>([
		a.getKey(),
		...a.getParents().map((p) => p.getKey()),
	]);
	if (ancestors.has(b.getKey())) return b; // b is a, or contains a
	return b.getParents().find((p) => ancestors.has(p.getKey())) ?? null;
}

function $convertSelection() {
	const selection = $getSelection();
	if (!$isRangeSelection(selection)) return;

	const a = $blockOf(selection.anchor.getNode());
	const f = $blockOf(selection.focus.getNode());
	if (!a || !f) return;

	// one block -> itself; several -> their most common ancestor
	const target = a.is(f) ? a : $commonAncestor(a, f);
	if (target && !$isRootOrShadowRoot(target)) {
		$convertBlock(target);
		return;
	}

	// selection spans top-level blocks: handle each leaf block separately
	const blocks = new Map<NodeKey, ElementNode>();
	for (const node of selection.getNodes()) {
		const b = $blockOf(node);
		if (b && !$isRootOrShadowRoot(b) && !$isContainer(b)) blocks.set(b.getKey(), b);
	}
	for (const b of blocks.values()) $convertBlock(b);
}

export function ParagraphPlugin() {
	const [editor] = useLexicalComposerContext();

	useEffect(
		() =>
			editor.registerCommand(
				CONVERT_TO_PARAGRAPH_COMMAND,
				() => {
					const selection = $getSelection();
					if (!$isRangeSelection(selection)) return false;

					// list items leave their list first
					if (
						selection
							.getNodes()
							.some(
								(n) =>
									$isListItemNode(n) || $isListItemNode(n.getParent()),
							)
					) {
						editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
					}
					$convertSelection();
					return true;
				},
				COMMAND_PRIORITY_LOW,
			),
		[editor],
	);

	return null;
}
