import { BrowserWindow, Menu } from 'electron';

import { ipcMainHandler } from '../../utils/ipc/ipcMainHandler';

import { contextMenuChannel } from '.';

export const enableContextMenu = () =>
	contextMenuChannel.server(ipcMainHandler, {
		async open({ req: [props], ctx: event }) {
			const targetWindow = BrowserWindow.fromWebContents(event.sender);
			if (!targetWindow) return;

			const { menu: menuTemplate, x, y } = props ?? {};

			// Handle click on menu
			let onClick: (itemId: string | null) => void;
			const onClickPromise = new Promise<string | null>((res) => {
				onClick = res;
			});

			const prepareMenu = (menu: Electron.MenuItemConstructorOptions[]) => {
				const newMenu: Electron.MenuItemConstructorOptions[] = [];
				for (const { id, click, submenu, ...restProps } of menu) {
					// Decorate click handler, to resolve promise with menu id by click on menu
					const clickHandler =
						id === undefined
							? click
							: (
									menuItem: Electron.MenuItem,
									browserWindow: Electron.BaseWindow | undefined,
									event: Electron.KeyboardEvent,
								) => {
									// NOTE: actually the click will never passed
									// because functions cannot be serialized
									if (click) click(menuItem, browserWindow, event);
									onClick(id);
								};

					newMenu.push({
						id,
						click: clickHandler,
						submenu: Array.isArray(submenu) ? prepareMenu(submenu) : submenu,
						...restProps,
					});
				}

				return newMenu;
			};

			const menu = Menu.buildFromTemplate(
				prepareMenu(menuTemplate as Electron.MenuItemConstructorOptions[]),
			);

			menu.popup({ window: targetWindow, x, y });
			menu.once('menu-will-close', () => {
				// Delay on next tick, to allow to handle click event
				setTimeout(() => {
					onClick(null);
				}, 0);
			});

			return onClickPromise;
		},
	});
