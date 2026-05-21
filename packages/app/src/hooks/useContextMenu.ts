import { useCallback, useEffect, useRef, useState } from 'react';
import { ContextMenu } from '@electron/requests/contextMenu';
import { hasElectronApi } from '@electron/utils/renderer';
import {
	DOMContextMenu,
	ElectronContextMenu,
} from '@features/NotesContainer/NoteContextMenu/ElectronContextMenu';

export type ContextMenuCallback<T extends string> = (event: {
	id: string;
	action: T;
}) => void;

// TODO: implement context menu on web technologies
/**
 * Provide callback for open context menu
 */
export const useContextMenu = <T extends string>(
	menu: ContextMenu,
	callback: ContextMenuCallback<T>,
) => {
	const [contextMenu, setContextMenu] = useState(() => {
		// TODO: provide constructor in react context
		return hasElectronApi()
			? new ElectronContextMenu<T>(menu)
			: new DOMContextMenu<T>(menu);
	});

	// Update menu
	useEffect(() => {
		setContextMenu(
			hasElectronApi()
				? new ElectronContextMenu<T>(menu)
				: new DOMContextMenu<T>(menu),
		);
	}, [menu]);

	const contextMenuTargetRef = useRef<string | null>(null);
	const show = useCallback(
		(id: string, point: { x: number; y: number }) => {
			contextMenu.open(point);
			contextMenuTargetRef.current = id;
		},
		[contextMenu],
	);

	useEffect(() => {
		const unsubscribeOnClose = contextMenu.onClose(() => {
			contextMenuTargetRef.current = null;
		});

		const unsubscribeOnClick = contextMenu.onClick((action) => {
			const id = contextMenuTargetRef.current;
			if (id === null) return;

			contextMenuTargetRef.current = null;
			callback({ action, id });
		});

		return () => {
			unsubscribeOnClose();
			unsubscribeOnClick();
		};
	}, [callback, contextMenu]);

	return show;
};
