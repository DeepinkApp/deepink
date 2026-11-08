import { useCallback } from 'react';
import copy from 'copy-to-clipboard';
import { isResourceUrl } from '@core/features/links';
import { ContextMenu } from '@electron/requests/contextMenu';
import { useFileSaver } from '@hooks/useFileSaver';

import { ContextMenuBuilder } from './types';

export const useResourceMenu = (): ContextMenuBuilder => {
	const saveFile = useFileSaver();

	return useCallback<ContextMenuBuilder>(
		(context) => {
			const menu: ContextMenu = [];
			const linkUrl = context.link?.url.trim() ?? '';
			if (linkUrl) {
				menu.push({
					label: 'Copy Link',
					click() {
						copy(linkUrl);
					},
				});
			}

			const imageUrl = context.image?.url.trim() ?? '';
			if (imageUrl) {
				menu.push({
					label: 'Copy Image Link',
					click() {
						copy(imageUrl);
					},
				});

				if (isResourceUrl(imageUrl))
					menu.push({
						label: 'Download image',
						click() {
							saveFile(imageUrl);
						},
					});
			}

			return menu;
		},
		[saveFile],
	);
};
