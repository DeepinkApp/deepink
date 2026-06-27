import { createEditor, LexicalEditor } from 'lexical';
import { visit } from 'unist-util-visit';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { MarkNode } from '@lexical/mark';
import { OverflowNode } from '@lexical/overflow';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';

import { ImageNode } from '../../Image/ImageNode';

import { FormattingNode } from '../nodes/FormattingNode';
import { RawNode } from '../nodes/RawNode';

/**
 * Normalize Markdown AST to get rid vary things not to compare
 */
export function normalizeMarkdownTree(tree: any) {
	visit(tree, (node) => {
		if (node && typeof node === 'object') {
			delete node.position;
		}
	});

	return tree;
}
/**
 * Update Lexical editor state and resolve promise when update will be applied
 */
export const updateEditorState = (editor: LexicalEditor, updateFn: () => void) => {
	return new Promise<void>((res) => {
		editor.update(updateFn, {
			onUpdate() {
				res();
			},
		});
	});
};

/**
 * Helper to create Lexical Editor instance equivalent to used in app
 */
export const createLexicalEditorInstance = () => {
	const editor = createEditor({
		nodes: [
			// App specific nodes
			RawNode,
			FormattingNode,
			ImageNode,

			// Plugins
			LinkNode,
			AutoLinkNode,
			ListNode,
			ListItemNode,
			TableNode,
			TableCellNode,
			TableRowNode,
			HorizontalRuleNode,
			HeadingNode,
			QuoteNode,
			CodeNode,
			CodeHighlightNode,
			MarkNode,
			OverflowNode,
		],
	});

	const rootElement = document.createElement('div');
	document.body.appendChild(rootElement);
	editor.setRootElement(rootElement);

	return {
		editor,
		rootElement,
		destroy() {
			editor.setRootElement(null);
		},
	};
};
