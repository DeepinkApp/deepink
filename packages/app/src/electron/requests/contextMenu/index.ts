import { MenuPosition } from '@utils/menu/AppContextMenu';

import { createChannel } from '../../utils/ipc';

export const ipcChannelName = 'context-menu';

export type SimpleMenuItemCallback = (menuItem: SimpleMenuItem) => void;
export type SimpleMenuItem = Pick<
	Electron.MenuItemConstructorOptions,
	| 'id'
	| 'role'
	| 'type'
	| 'label'
	| 'accessibilityLabel'
	| 'sublabel'
	| 'toolTip'
	| 'accelerator'
	| 'enabled'
	| 'visible'
	| 'checked'
> & {
	submenu?: SimpleMenuItem[];
	click?: SimpleMenuItemCallback;
};

export type ContextMenu = SimpleMenuItem[];

export const contextMenuChannel = createChannel<{
	open: ({
		menu,
		x,
		y,
	}: MenuPosition & { menu: ContextMenu }) => Promise<string | null>;
}>({ name: 'contextMenu' });
