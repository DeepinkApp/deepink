import { ContextMenu } from '@electron/requests/contextMenu';

export const normalizeMenu = (menu: ContextMenu): ContextMenu => {
	const normalized: ContextMenu = [];

	for (const item of menu) {
		if (item.type === 'separator') {
			if (
				normalized.length === 0 ||
				normalized[normalized.length - 1].type === 'separator'
			) {
				continue;
			}

			normalized.push(item);
			continue;
		}

		if (item.submenu) {
			normalized.push({ ...item, submenu: normalizeMenu(item.submenu) });
		} else {
			normalized.push(item);
		}
	}

	if (normalized.at(-1)?.type === 'separator') normalized.pop();

	return normalized;
};
