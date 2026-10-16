import { createContext, useCallback, useContext } from 'react';
import { ContextMenu } from '@electron/requests/contextMenu';
import { openContextMenu } from '@electron/requests/contextMenu/renderer';
import { hasElectronApi } from '@electron/utils/renderer';
import {
	AppContextMenu,
	createMenuItemIdGenerator,
	MenuPosition,
} from '@utils/menu/AppContextMenu';

// TODO: implement context menu on web technologies and provide renderer
// TODO: use chakra-ui menu in browser
const AppContextMenuContext = createContext<AppContextMenu>(
	new AppContextMenu(
		hasElectronApi()
			? (menu, position) => openContextMenu({ menu, ...position })
			: async (menu, position) => {
					console.debug('Context menu request', { menu, position });
					return null;
				},
		createMenuItemIdGenerator(),
	),
);

export const useAppContextMenu = () => {
	const contextMenu = useContext(AppContextMenuContext);

	return useCallback(
		(menu: ContextMenu, point: MenuPosition) => contextMenu.open(menu, point),
		[contextMenu],
	);
};
