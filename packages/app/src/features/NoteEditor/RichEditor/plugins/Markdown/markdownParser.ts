/* eslint-disable @typescript-eslint/no-use-before-define */
import {
	$createLineBreakNode,
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$isTextNode,
	IS_CODE,
	LexicalNode,
} from 'lexical';
import { Content, Root, RootContent } from 'mdast';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { Plugin, unified } from 'unified';
import { u } from 'unist-builder';
import { CONTINUE, SKIP, visit } from 'unist-util-visit';
import { $createCodeNode } from '@lexical/code';
import { $createLinkNode } from '@lexical/link';
import { $createListItemNode, $createListNode, ListType } from '@lexical/list';
import { $createHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import {
	$createTableCellNode,
	$createTableNode,
	$createTableRowNode,
	TableCellHeaderStates,
} from '@lexical/table';

import { $createImageNode } from '../Image/ImageNode';
import { convertLexicalNodeToMarkdownNode } from './convertLexicalNodeToMarkdownNode';
import { $createFormattingNode } from './nodes/FormattingNode';
import { $createRawNode } from './nodes/RawNode';

const remarkPreserveBlankLines: Plugin<[], Root> = () => {
	const ignoredNodeTypes = new Set<string>([
		'table',
		'tableCell',
		'tableRow',
	] satisfies RootContent['type'][]);

	return (tree: Root) => {
		const skipNodes = new Set<unknown>();

		visit(tree, (node) => {
			// Skip nodes with no nested elements
			if (!('children' in node)) return SKIP;

			// Skip ignored node types
			if (ignoredNodeTypes.has(node.type)) return SKIP;

			// Skip already handled nodes
			if (skipNodes.has(node)) return SKIP;

			const newChildren: RootContent[] = [];
			for (let i = 0; i < node.children.length; i++) {
				const current = node.children[i];
				const next = node.children[i + 1];

				// Collect its own children
				newChildren.push(current);

				// Add empty lines to preserve
				if (next && current.position && next.position) {
					const lineGap = next.position.start.line - current.position.end.line;
					// lineGap === 2 means exactly one blank line, 3 means two, etc.
					const blankLineCount = lineGap - 1;

					for (let b = 0; b < blankLineCount; b++) {
						const line = current.position.end.line + 1 + b;
						const emptyLine = {
							type: 'paragraph',
							children: [],
							// TODO: add tests to verify position are correct in complex cases
							position: {
								start: { line, column: 1, offset: 0 },
								end: { line, column: 1, offset: 0 },
							},
						} as RootContent;

						newChildren.push(emptyLine);
						skipNodes.add(emptyLine);
					}
				}
			}

			node.children = newChildren;

			return CONTINUE;
		});
	};
};

export const markdownProcessor = unified()
	.use(remarkParse)
	.use(remarkPreserveBlankLines)
	.use(remarkGfm)
	.use(remarkStringify, {
		bullet: '-',
		listItemIndent: 'one',
		join: [
			() => {
				return 0;
			},
		],
	})
	.freeze();

export const parseMarkdownToAST = (source: string) => {
	return markdownProcessor.runSync(markdownProcessor.parse(source));
};

export const dumpMarkdownNode = (node: Content) => {
	const content = markdownProcessor.stringify(
		u('root', {
			children: [node],
		}) satisfies Root,
	);

	if (content.endsWith('\n')) {
		return content.slice(0, -1);
	}

	return content;
};

export const $convertFromMarkdownString = (rawMarkdown: string) => {
	const mdTree = parseMarkdownToAST(rawMarkdown);

	function convertToMarkdownNode(node: Content): LexicalNode {
		switch (node.type) {
			case 'text': {
				return $createTextNode(node.value);
			}
			case 'paragraph': {
				const paragraph = $createParagraphNode();
				paragraph.append(...convertToMarkdownNodes(node.children));

				return paragraph;
			}
			case 'image': {
				return $createImageNode({
					src: node.url,
					altText: node.alt || '',
				});
			}
			case 'heading': {
				const heading = $createHeadingNode(`h${node.depth}`);
				heading.append(...convertToMarkdownNodes(node.children));

				return heading;
			}
			case 'list': {
				let listType: ListType = 'bullet';
				if (
					node.children.some(
						(item) => item.checked !== undefined && item.checked !== null,
					)
				) {
					listType = 'check';
				} else if (node.ordered || typeof node.start === 'number') {
					listType = 'number';
				}

				const list = $createListNode(listType);
				list.append(...convertToMarkdownNodes(node.children));

				return list;
			}
			case 'listItem': {
				const listItem = $createListItemNode(node.checked ?? undefined);
				listItem.append(...convertToMarkdownNodes(node.children));

				return listItem;
			}
			case 'link': {
				const link = $createLinkNode(node.url, { title: node.title });
				link.append(...convertToMarkdownNodes(node.children));

				return link;
			}
			case 'blockquote': {
				const quote = $createQuoteNode();
				quote.append(...convertToMarkdownNodes(node.children));

				return quote;
			}
			case 'table': {
				const table = $createTableNode();
				table.append(...convertToMarkdownNodes(node.children));
				return table;
			}
			case 'tableRow': {
				const tableRow = $createTableRowNode();
				tableRow.append(...convertToMarkdownNodes(node.children));
				return tableRow;
			}
			case 'tableCell': {
				const tableCell = $createTableCellNode(TableCellHeaderStates.NO_STATUS);

				const p = $createParagraphNode();
				p.append(...convertToMarkdownNodes(node.children));
				tableCell.append(p);

				return tableCell;
			}
			case 'code': {
				const code = $createCodeNode(node.lang);
				code.append($createTextNode(node.value));

				return code;
			}
			case 'inlineCode': {
				const text = $createTextNode(node.value);
				text.setFormat(IS_CODE);
				return text;
			}
			case 'emphasis': {
				const format = $createFormattingNode({ tag: 'em' });
				format.append(...convertToMarkdownNodes(node.children));

				return format;
			}
			case 'strong': {
				const format = $createFormattingNode({ tag: 'b' });
				format.append(...convertToMarkdownNodes(node.children));

				return format;
			}
			case 'delete': {
				const format = $createFormattingNode({ tag: 'del' });
				format.append(...convertToMarkdownNodes(node.children));

				return format;
			}
			case 'break': {
				return $createLineBreakNode();
			}
			case 'thematicBreak': {
				const format = $createHorizontalRuleNode();
				return format;
			}
		}

		const rawNode = $createRawNode();
		rawNode.append($createTextNode(dumpMarkdownNode(node)));
		return rawNode;
	}

	function convertToMarkdownNodes(mdTree: Content[]): LexicalNode[] {
		const lexicalTree: LexicalNode[] = [];
		for (const mdNode of mdTree) {
			lexicalTree.push(convertToMarkdownNode(mdNode));
		}

		return lexicalTree;
	}

	const lexicalNodes = convertToMarkdownNodes(mdTree.children).map((node) => {
		if (!$isTextNode(node)) return node;

		const paragraph = $createParagraphNode();
		paragraph.append(node);
		return paragraph;
	});

	const rootNode = $getRoot();
	rootNode.clear();
	rootNode.append(...lexicalNodes);
};

export const $serializeAsMarkdownAST = () => {
	const rootNode = $getRoot();
	const children = rootNode.getChildren();
	return u('root', {
		children: children.map(convertLexicalNodeToMarkdownNode),
	}) satisfies Root;
};

export const $convertToMarkdownString = () => {
	return markdownProcessor.stringify($serializeAsMarkdownAST());
};
