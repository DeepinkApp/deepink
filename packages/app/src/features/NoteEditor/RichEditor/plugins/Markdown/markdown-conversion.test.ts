/**
 * @vitest-environment jsdom
 */

import { $getRoot, createEditor, LexicalEditor } from 'lexical';
import { u } from 'unist-builder';
import { visit } from 'unist-util-visit';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { MarkNode } from '@lexical/mark';
import { OverflowNode } from '@lexical/overflow';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';

import { ImageNode } from '../Image/ImageNode';
import { convertLexicalNodeToMarkdownNode } from './convertLexicalNodeToMarkdownNode';
import { $convertFromMarkdownString, markdownProcessor } from './markdownParser';
import { FormattingNode } from './nodes/FormattingNode';
import { RawNode } from './nodes/RawNode';

function normalizeTree(tree: any) {
	visit(tree, (node) => {
		if (node && typeof node === 'object') {
			delete node.position;
		}
	});

	return tree;
}

const update = (editor: LexicalEditor, updateFn: () => void) => {
	return new Promise<void>((res) => {
		editor.update(updateFn, {
			onUpdate() {
				res();
			},
		});
	});
};

test('Demo', async () => {
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

	const contentEditableElement = document.createElement('div');
	document.body.appendChild(contentEditableElement);
	editor.setRootElement(contentEditableElement);

	const sourceText = '- foo\n  - bar\n  - baz';

	await update(editor, () => {
		$convertFromMarkdownString(sourceText);
	});

	expect(
		Array.from(contentEditableElement.querySelectorAll('ul > li > span')).map(
			(li) => li.textContent,
		),
	).toEqual(['foo', 'bar', 'baz']);

	expect(
		u('root', {
			children: editor.read(() =>
				$getRoot()
					.getChildren()
					.map((node) => normalizeTree(convertLexicalNodeToMarkdownNode(node))),
			),
		}),
	).toMatchObject(normalizeTree(markdownProcessor.parse(sourceText)));
});
