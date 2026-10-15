import { getZoomFactor } from '@utils/os/zoom';

import { ipcRendererFetcher } from '../../utils/ipc/ipcRendererFetcher';

import { contextMenuChannel } from '.';

export const { open: openContextMenu } = contextMenuChannel.client(ipcRendererFetcher);

export const getContextMenuCoords = (event: MouseEvent) => {
	// Consider zoom factor to draw context menu on proper coordinates for scaled windows
	// With no zoom factor, context menu will be rendered under pointer, and click random option
	const zoomFactor = getZoomFactor();
	return {
		x: Math.ceil(event.pageX * zoomFactor),
		y: Math.ceil(event.pageY * zoomFactor),
	};
};
