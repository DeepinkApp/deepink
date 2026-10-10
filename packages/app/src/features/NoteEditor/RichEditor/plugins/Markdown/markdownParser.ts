/* eslint-disable @typescript-eslint/no-use-before-define */
import {
	$createLineBreakNode,
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$isTextNode,
	LexicalNode,
	TextFormatType,
	TextNode,
} from 'lexical';
import { Content, type Root } from 'mdast';
import { defaultHandlers } from 'mdast-util-to-markdown';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { Processor, unified } from 'unified';
import { u } from 'unist-builder';
import { TextFormat } from '@features/NoteEditor/EditorPanel';
import { $createCodeNode } from '@lexical/code-core';
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
import { createSyncContext } from './createSyncContext';
import { $createRawNode } from './nodes/RawNode';
import { liftFormattingNodes } from './remark/remarkLiftFormatting';
import { fillGapsWithParagraphs } from './remark/remarkPreserveBlankLines';

export const markdownProcessor = unified()
	.use(remarkParse)
	.use(remarkGfm)
	.use(remarkStringify, {
		bullet: '-',
		listItemIndent: 'one',
		handlers: {
			paragraph(node, parent, state, info) {
				// Empty line will be added after that node anyway
				// So empty paragraph converts to 1 empty line
				if (node.children.length === 0) {
					return '';
				}

				// In case paragraph is not empty, we fallback
				// to default serializer
				return defaultHandlers.paragraph(node, parent, state, info);
			},
		},
		join: [
			(left, right) => {
				// Join empty paragraphs with no empty lines between them
				if (left.type === 'paragraph' && right.type === 'paragraph') {
					const isLeftEmpty = left.children.length === 0;
					const isRightEmpty = right.children.length === 0;

					// Join only in case both nodes are empty
					if (isLeftEmpty && isRightEmpty) return 0;

					// Otherwise do not change standard behavior
					return null;
				}

				return null;
			},
		],
	})
	.freeze() as unknown as Processor<Root, Root, Root, Root, string>;

export const parseMarkdownToAST = (source: string) => {
	return markdownProcessor.runSync(
		fillGapsWithParagraphs(markdownProcessor.parse(source)),
	);
};

export const serializeMarkdownTree = (tree: Root) => {
	return markdownProcessor.stringify(tree);
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

export const $wrapWithParagraph = (children: LexicalNode[]) => {
	const p = $createParagraphNode();
	p.append(...children);

	return p;
};

const $setTextNodeFormat = (node: TextNode, formats: Iterable<TextFormatType>) => {
	for (const format of formats) {
		node.toggleFormat(format);
	}
};

/**
 * MDAST node type to Lexical text format
 */
const textFormattingMap = {
	emphasis: 'italic',
	strong: 'bold',
	delete: 'strikethrough',
} satisfies Record<string, TextFormat>;

export const $convertFromMarkdownString = (rawMarkdown: string) => {
	const mdTree = parseMarkdownToAST(rawMarkdown);

	const textFormatContext = createSyncContext<Set<TextFormat>>(new Set());
	function convertToMarkdownNode(node: Content): LexicalNode[] {
		switch (node.type) {
			case 'text': {
				const t = $createTextNode(node.value);
				$setTextNodeFormat(t, textFormatContext.get());
				return [t];
			}
			case 'paragraph': {
				const paragraph = $createParagraphNode();
				paragraph.append(...convertToMarkdownNodes(node.children));

				return [paragraph];
			}
			case 'image': {
				return [
					$createImageNode({
						src: node.url,
						altText: node.alt || '',
					}),
				];
			}
			case 'heading': {
				const heading = $createHeadingNode(`h${node.depth}`);
				heading.append(...convertToMarkdownNodes(node.children));

				return [heading];
			}
			case 'list': {
				const defaultListType: ListType =
					node.ordered || typeof node.start === 'number' ? 'number' : 'bullet';
				const convertedLists: LexicalNode[] = [];

				let currentList: ReturnType<typeof $createListNode> | undefined;
				let currentListType: ListType | undefined;
				for (let i = 0; i < node.children.length; i++) {
					const item = node.children[i];
					const itemListType: ListType =
						item.checked !== undefined && item.checked !== null
							? 'check'
							: defaultListType;

					if (!currentList || currentListType !== itemListType) {
						currentListType = itemListType;
						currentList = $createListNode(
							itemListType,
							itemListType === 'number' ? (node.start ?? 1) + i : 1,
						);
						convertedLists.push(currentList);
					}

					currentList.append(...convertToMarkdownNode(item));
				}

				return convertedLists;
			}
			case 'listItem': {
				const listItem = $createListItemNode(node.checked ?? undefined);
				listItem.append(
					$wrapWithParagraph(convertToMarkdownNodes(node.children)),
				);

				return [listItem];
			}
			case 'link': {
				const link = $createLinkNode(node.url, { title: node.title });
				link.append(...convertToMarkdownNodes(node.children));

				return [link];
			}
			case 'blockquote': {
				const quote = $createQuoteNode();
				quote.append(...convertToMarkdownNodes(node.children));

				return [quote];
			}
			case 'table': {
				const table = $createTableNode();
				table.append(...convertToMarkdownNodes(node.children));
				return [table];
			}
			case 'tableRow': {
				const tableRow = $createTableRowNode();
				tableRow.append(...convertToMarkdownNodes(node.children));
				return [tableRow];
			}
			case 'tableCell': {
				const tableCell = $createTableCellNode(TableCellHeaderStates.NO_STATUS);

				const p = $createParagraphNode();
				p.append(...convertToMarkdownNodes(node.children));
				tableCell.append(p);

				return [tableCell];
			}
			case 'code': {
				const code = $createCodeNode(node.lang);
				code.append($createTextNode(node.value));

				return [code];
			}
			case 'inlineCode': {
				const text = $createTextNode(node.value);
				$setTextNodeFormat(text, [...textFormatContext.get(), 'code']);
				return [text];
			}
			// TODO: handle sub/super/etc
			case 'emphasis':
			case 'strong':
			case 'delete': {
				return textFormatContext.use(
					textFormatContext
						.get()
						.union(new Set([textFormattingMap[node.type]])),
					() => convertToMarkdownNodes(node.children),
				);
			}
			case 'break': {
				return [$createLineBreakNode()];
			}
			case 'thematicBreak': {
				return [$createHorizontalRuleNode()];
			}
		}

		const rawNode = $createRawNode();
		rawNode.append($createTextNode(dumpMarkdownNode(node)));
		return [rawNode];
	}

	function convertToMarkdownNodes(mdTree: Content[]): LexicalNode[] {
		const lexicalTree: LexicalNode[] = [];
		for (const mdNode of mdTree) {
			lexicalTree.push(...convertToMarkdownNode(mdNode));
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

	if (lexicalNodes.length > 0) {
		rootNode.append(...lexicalNodes);
	} else {
		rootNode.append($createParagraphNode());
	}
};

export const $serializeAsMarkdownAST = () => {
	const rootNode = $getRoot();
	const children = rootNode.getChildren();

	const tree = u('root', {
		children: children.map(convertLexicalNodeToMarkdownNode),
	}) satisfies Root;

	liftFormattingNodes(tree);

	return tree;
};

export const $convertToMarkdownString = () => {
	return markdownProcessor.stringify($serializeAsMarkdownAST());
};
