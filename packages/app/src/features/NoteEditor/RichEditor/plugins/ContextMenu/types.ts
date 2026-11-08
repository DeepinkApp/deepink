import { BaseSelection, NodeKey } from 'lexical';
import { ContextMenu } from '@electron/requests/contextMenu';

export type ContextMenuContext = {
	targetKey: NodeKey;
	selection: BaseSelection | null;
	selectedText: string;
	link: { key: NodeKey; url: string; title: string } | null;
	image: { key: NodeKey; url: string; altText: string } | null;
	codeBlock: { key: NodeKey; language: string | null } | null;
	listType: 'bullet' | 'number' | 'check' | null;
	headingTag: string | null;
	isQuote: boolean;
	canFormatSelection: boolean;
};

export type ContextMenuBuilder = (context: ContextMenuContext) => ContextMenu;
