import { ContextMenu, SimpleMenuItem } from '@electron/requests/contextMenu';

import { AppContextMenu, MenuPosition } from './AppContextMenu';

export const getMenuItemsMap = (menu: ContextMenu) => {
	const callbacksMap = new Map<string, SimpleMenuItem>();
	const exploreMenu = (menu: ContextMenu) => {
		for (const item of menu) {
			const { id, submenu } = item;
			if (id) callbacksMap.set(id, item);

			if (submenu) exploreMenu(submenu);
		}
	};

	exploreMenu(menu);

	return callbacksMap;
};

export type MenuItemSelector = (context: {
	menu: ContextMenu;
	position: MenuPosition;
	itemsMap: Map<string, SimpleMenuItem>;
}) => Promise<null | string>;

export class MockedContextMenu {
	constructor(private readonly selector: MenuItemSelector) {}
	open = async (menu: ContextMenu, position: MenuPosition) => {
		const itemsMap = getMenuItemsMap(menu);

		return this.selector({ menu, position, itemsMap });
	};
}

export const createFakeContextMenu = () => {
	const selector = vi.fn<MenuItemSelector>(async () => null);
	const renderer = new MockedContextMenu(selector);
	const menu = new AppContextMenu(renderer.open);

	return { selector, renderer, menu };
};
