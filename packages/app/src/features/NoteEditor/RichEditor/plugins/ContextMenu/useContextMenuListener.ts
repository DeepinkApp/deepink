import { useEffect } from 'react';
import { $getNearestNodeFromDOMNode } from 'lexical';
import { getContextMenuCoords } from '@electron/requests/contextMenu/renderer';
import { useAppContextMenu } from '@hooks/useAppContextMenu';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import { $collectContextMenuContext } from './collectContext';
import { ContextMenuBuilder } from './types';

export const useContextMenuListener = (builders: readonly ContextMenuBuilder[]) => {
	const [editor] = useLexicalComposerContext();
	const showMenu = useAppContextMenu();

	useEffect(() => {
		const onContextMenu = (event: MouseEvent) => {
			const target = event.target;
			if (!(target instanceof Node)) return;

			const menu = editor.read(() => {
				const targetNode = $getNearestNodeFromDOMNode(target);
				if (!targetNode) return null;

				const targetElement = editor.getElementByKey(targetNode.getKey());
				if (!targetElement) return null;

				const context = $collectContextMenuContext(targetNode);
				return builders.flatMap((build) => build(context));
			});

			if (!menu) return;

			event.preventDefault();
			showMenu(menu, getContextMenuCoords(event));
		};

		return editor.registerRootListener((rootElement, previousRootElement) => {
			previousRootElement?.removeEventListener('contextmenu', onContextMenu, {
				capture: true,
			});
			rootElement?.addEventListener('contextmenu', onContextMenu, {
				capture: true,
			});
		});
	}, [builders, editor, showMenu]);
};
