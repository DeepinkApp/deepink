import { useCallback } from 'react';
import saveAs from 'file-saver';
import { getAppResourceDataInUrl } from '@core/features/links';
import { useFilesRegistry } from '@features/App/Workspace/WorkspaceProvider';

export const useFileSaver = () => {
	const filesRegistry = useFilesRegistry();

	return useCallback(
		async (url: string) => {
			const resourceData = getAppResourceDataInUrl(url);
			if (!resourceData || resourceData.type !== 'resource') return;

			const file = await filesRegistry.get(resourceData.id);
			if (!file) return;

			const buffer = await file.arrayBuffer();
			saveAs(new Blob([buffer]), file.name);
		},
		[filesRegistry],
	);
};
