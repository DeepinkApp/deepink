import { ContextMenu, SimpleMenuItem } from '@electron/requests/contextMenu';

import { AppContextMenu, getMenuItemsMap, MenuPosition } from './AppContextMenu';

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
