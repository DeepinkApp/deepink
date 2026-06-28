import { $isLineBreakNode, $isParagraphNode, $isTextNode, LexicalNode } from 'lexical';
import {
	Blockquote,
	Break,
	Code,
	Content,
	Delete,
	Emphasis,
	Heading,
	HTML,
	Image,
	InlineCode,
	Link,
	List,
	ListItem,
	Paragraph,
	Strong,
	Table,
	TableCell,
	TableRow,
	Text,
	ThematicBreak,
} from 'mdast';
import { u } from 'unist-builder';
import { $isCodeNode } from '@lexical/code';
import { $isLinkNode } from '@lexical/link';
import { $isListItemNode, $isListNode } from '@lexical/list';
import { $isHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { $isHeadingNode, $isQuoteNode } from '@lexical/rich-text';
import { $isTableCellNode, $isTableNode, $isTableRowNode } from '@lexical/table';

import { $isImageNode } from '../Image/ImageNode';
import { $isFormattingNode } from './nodes/FormattingNode';

const inlineTypes = new Set([
	'text',
	'emphasis',
	'strong',
	'delete',
	'inlineCode',
	'break',
	'link',
	'image',
]);

export const convertLexicalNodeToMarkdownNode = (node: LexicalNode): Content => {
	if ($isParagraphNode(node)) {
		const paragraph = u('paragraph', { children: [] }) as Paragraph;

		for (const child of node.getChildren()) {
			const content = convertLexicalNodeToMarkdownNode(child);
			paragraph.children.push(content as any);
		}

		return paragraph;
	}

	if ($isImageNode(node)) {
		return u('image', {
			url: node.getSrc(),
			alt: node.getAltText(),
			title: null,
		}) satisfies Image;
	}

	if ($isTextNode(node)) {
		if (node.hasFormat('code')) {
			return u('inlineCode', {
				value: node.getTextContent(),
			}) satisfies InlineCode;
		}

		return u('text', { value: node.getTextContent() }) satisfies Text;
	}

	if ($isCodeNode(node)) {
		return u('code', {
			lang: node.getLanguage(),
			meta: null,
			value: node.getTextContent(),
		}) satisfies Code;
	}

	if ($isFormattingNode(node)) {
		const tagName = node.getTagName();
		switch (tagName) {
			case 'em': {
				return u('emphasis', {
					children: node
						.getChildren()
						.map(convertLexicalNodeToMarkdownNode) as Emphasis['children'],
				}) satisfies Emphasis;
			}
			case 'del': {
				return u('delete', {
					children: node
						.getChildren()
						.map(convertLexicalNodeToMarkdownNode) as Delete['children'],
				}) satisfies Delete;
			}
			case 'b': {
				return u('strong', {
					children: node
						.getChildren()
						.map(convertLexicalNodeToMarkdownNode) as Strong['children'],
				}) satisfies Strong;
			}
		}
	}

	if ($isHorizontalRuleNode(node)) {
		return u('thematicBreak') satisfies ThematicBreak;
	}

	if ($isListNode(node)) {
		return u('list', {
			ordered: node.getTag() === 'ol',
			start: node.getListType() === 'number' ? node.getStart() : null,
			spread: false,
			children: node
				.getChildren()
				.map(convertLexicalNodeToMarkdownNode) as List['children'],
		}) satisfies List;
	}
	if ($isListItemNode(node)) {
		return u('listItem', {
			spread: false,
			checked: node.getChecked() ?? null,
			children: node.getChildren().map((children) => {
				const mdNode = convertLexicalNodeToMarkdownNode(children);

				if (inlineTypes.has(mdNode.type))
					return u('paragraph', {
						children: [mdNode],
					});

				return mdNode;
			}),
		}) as ListItem;
	}

	if ($isLinkNode(node)) {
		return u('link', {
			url: node.getURL(),
			title: node.getTitle(),
			children: node
				.getChildren()
				.map(convertLexicalNodeToMarkdownNode) as Link['children'],
		}) satisfies Link;
	}

	if ($isQuoteNode(node)) {
		return u('blockquote', {
			children: node
				.getChildren()
				.map(convertLexicalNodeToMarkdownNode) as Blockquote['children'],
		}) satisfies Blockquote;
	}

	if ($isTableNode(node)) {
		return u('table', {
			align: [null, null],
			children: node
				.getChildren()
				.map(convertLexicalNodeToMarkdownNode) as Table['children'],
		}) satisfies Table;
	}
	if ($isTableRowNode(node)) {
		return u('tableRow', {
			children: node
				.getChildren()
				.map(convertLexicalNodeToMarkdownNode) as TableRow['children'],
		}) satisfies TableRow;
	}
	if ($isTableCellNode(node)) {
		return u('tableCell', {
			children: node
				.getChildren()
				.map(convertLexicalNodeToMarkdownNode) as TableCell['children'],
		}) satisfies TableCell;
	}

	if ($isLineBreakNode(node)) {
		return u('break', {}) satisfies Break;
	}

	if ($isHeadingNode(node)) {
		const depth = Math.max(
			1,
			Math.min(parseInt(node.getTag().slice(1)), 6),
		) as Heading['depth'];
		return u('heading', {
			depth: depth,
			children: node
				.getChildren()
				.map(convertLexicalNodeToMarkdownNode) as Heading['children'],
		}) satisfies Heading;
	}

	// Default node
	return u('html', { value: node.getTextContent() }) as HTML;
};
