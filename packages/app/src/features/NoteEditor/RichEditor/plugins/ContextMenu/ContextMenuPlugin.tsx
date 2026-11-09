import React, { useMemo } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import { ParagraphPlugin } from './ParagraphPlugin';
import { useBlockMenu } from './useBlockMenu';
import { useClipboardMenu } from './useClipboardMenu';
import { useCodeLanguageMenu } from './useCodeLanguageMenu';
import { useContextMenuListener } from './useContextMenuListener';
import { useFormattingMenu } from './useFormattingMenu';
import { useInsertMenu } from './useInsertMenu';
import { useLinkMenu } from './useLinkMenu';
import { useMediaMenu } from './useMediaMenu';
import { useResourceMenu } from './useResourceMenu';
import { useSelectionMenu } from './useSelectionMenu';

export const ContextMenuPlugin = () => {
	const [editor] = useLexicalComposerContext();

	const linkMenu = useLinkMenu(editor);
	const mediaMenu = useMediaMenu(editor);
	const resourceMenu = useResourceMenu();
	const selectionMenu = useSelectionMenu();
	const formattingMenu = useFormattingMenu(editor);
	const blockMenu = useBlockMenu(editor);
	const insertMenu = useInsertMenu(editor);
	const codeLanguageMenu = useCodeLanguageMenu(editor);
	const clipboardMenu = useClipboardMenu();

	const builders = useMemo(
		() => [
			linkMenu,
			mediaMenu,
			resourceMenu,
			selectionMenu,
			formattingMenu,
			blockMenu,
			insertMenu,
			codeLanguageMenu,
			clipboardMenu,
		],
		[
			linkMenu,
			mediaMenu,
			resourceMenu,
			selectionMenu,
			formattingMenu,
			blockMenu,
			insertMenu,
			codeLanguageMenu,
			clipboardMenu,
		],
	);

	useContextMenuListener(builders);

	return <ParagraphPlugin />;
};
