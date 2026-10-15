import { createEvent } from 'effector';
// TODO: move all types here
import { ContextMenu, SimpleMenuItem } from '@electron/requests/contextMenu';

export type VoidCallback = () => void;

export type MenuPosition = { x: number; y: number };
export type MenuRenderer = (
	menu: ContextMenu,
	position: MenuPosition,
) => Promise<string | null>;

const clearMenu = (menu: ContextMenu) => {
	const newMenu: ContextMenu = [];
	for (const { click, submenu, ...simpleMenuItem } of menu) {
		newMenu.push({
			...simpleMenuItem,
			submenu: submenu ? clearMenu(submenu) : submenu,
		});
	}

	return newMenu;
};

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

export class AppContextMenu<K extends string = string> {
	protected readonly onClosed;
	protected readonly onClicked;
	constructor(private readonly renderer: MenuRenderer) {
		this.onClosed = createEvent();
		this.onClicked = createEvent<{ id: K; menuItem: SimpleMenuItem }>();
	}

	public open(menu: ContextMenu, { x, y }: { x: number; y: number }) {
		const menuItems = getMenuItemsMap(menu);

		return this.renderer(clearMenu(menu), { x, y }).then((itemId) => {
			const menuItem = itemId ? menuItems.get(itemId) : null;
			if (!menuItem) {
				this.onClosed();
				return null;
			}

			const clickedItem = { id: itemId as K, menuItem };
			this.onClicked(clickedItem);

			if (menuItem?.click) menuItem.click(menuItem);

			return clickedItem;
		});
	}

	public onClose(callback: VoidCallback) {
		return this.onClosed.watch(callback);
	}

	public onClick(callback: (id: K, menuItem: SimpleMenuItem) => void) {
		return this.onClicked.watch(({ id, menuItem }) => {
			callback(id, menuItem);
		});
	}
}
