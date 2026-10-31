/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { ContextMenu, SimpleMenuItem } from '@electron/requests/contextMenu';

import {
	AppContextMenu,
	createMenuItemIdGenerator,
	MenuPosition,
} from './AppContextMenu';

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
	const menu = new AppContextMenu(renderer.open, createMenuItemIdGenerator());

	return { selector, renderer, menu };
};

export const findMenuItemById = (
	menu: ContextMenu,
	locator: Partial<SimpleMenuItem>[],
) => {
	let currentMenu: SimpleMenuItem | null = null;
	for (const segment of locator) {
		const foundItem = (currentMenu?.submenu || menu).find((item) =>
			Object.entries(segment).every(
				([key, value]) => item[key as keyof SimpleMenuItem] === value,
			),
		) as SimpleMenuItem | undefined;

		if (!foundItem) return null;

		currentMenu = foundItem;
	}

	return currentMenu;
};

export const createMenuItemSelector =
	(locator: Partial<SimpleMenuItem>[]): MenuItemSelector =>
	async ({ menu }) => {
		const item = findMenuItemById(menu, locator);

		if (!item) {
			console.warn(menu);
			return null;
		}

		return item.id ?? null;
	};

export const selectMenuByLabel = (locator: string[]) =>
	createMenuItemSelector(locator.map((label) => ({ label })));
