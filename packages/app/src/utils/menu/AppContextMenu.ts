import { createEvent } from 'effector';
// TODO: move all types here
import { ContextMenu, SimpleMenuItem } from '@electron/requests/contextMenu';

export type VoidCallback = () => void;

export type MenuPosition = { x: number; y: number };
export type MenuRenderer = (
	menu: ContextMenu,
	position: MenuPosition,
) => Promise<string | null>;

export type MenuItemIdGenerator = (item: SimpleMenuItem) => string | undefined;

export const createMenuItemIdGenerator = (): MenuItemIdGenerator => {
	const seed = Math.random();
	let counter = 0;
	const getId = () => `uid:${seed}+${++counter}`;
	return (item) => item.id ?? getId();
};

/**
 * Creates virtual menu to transfer via IPC
 *
 * If id generator is provided, virtual menu will use generated ids.
 * Use method `getOriginalItem` to find original item by virtual id.
 */
class VirtualMenu {
	constructor(
		private readonly menu: ContextMenu,
		private readonly getId?: MenuItemIdGenerator,
	) {}

	private cache: ContextMenu | null = null;
	public get() {
		if (!this.cache) {
			this.cache = this.compile(this.menu);
		}

		return this.cache;
	}

	public getOriginalItem(vid: string) {
		return this.idMap.get(vid) ?? null;
	}

	private readonly idMap = new Map<string, SimpleMenuItem>();
	private compile(menu: ContextMenu): ContextMenu {
		const newMenu: ContextMenu = [];
		for (const originalItem of menu) {
			const { id, click, submenu, ...simpleMenuItem } = originalItem;
			const vid = this.getId ? this.getId(originalItem) : id;
			if (vid !== undefined) this.idMap.set(vid, originalItem);
			newMenu.push({
				...simpleMenuItem,
				id: vid,
				submenu: submenu ? this.compile(submenu) : submenu,
			});
		}

		return newMenu;
	}
}

export class AppContextMenu {
	protected readonly onClosed;
	protected readonly onClicked;
	constructor(
		private readonly renderer: MenuRenderer,
		private readonly idGenerator?: MenuItemIdGenerator,
	) {
		this.onClosed = createEvent();
		this.onClicked = createEvent<SimpleMenuItem>();
	}

	public open(menu: ContextMenu, { x, y }: { x: number; y: number }) {
		const vMenu = new VirtualMenu(menu, this.idGenerator);
		return this.renderer(vMenu.get(), { x, y }).then((itemId) => {
			const menuItem = itemId ? vMenu.getOriginalItem(itemId) : null;
			if (!menuItem) {
				this.onClosed();
				return null;
			}

			this.onClicked(menuItem);

			if (menuItem?.click) menuItem.click(menuItem);

			return menuItem;
		});
	}

	public onClose(callback: VoidCallback) {
		return this.onClosed.watch(callback);
	}

	public onClick(callback: (menuItem: SimpleMenuItem) => void) {
		return this.onClicked.watch(callback);
	}
}
