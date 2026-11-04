import * as React from 'react';
import { useState } from 'react';
import { FaDownload } from 'react-icons/fa6';
import { Box, Button } from '@chakra-ui/react';
import { getResourceIdInUrl } from '@core/features/links';
import { useFilesRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { saveFile } from '@utils/fs/client';
import { escapeFileName } from '@utils/fs/paths';

const MIME_TO_EXTENSION: Record<string, string> = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/webp': 'webp',
	'image/gif': 'gif',
	'image/svg+xml': 'svg',
};

const buildDownloadFileName = ({ name, type }: { name?: string; type: string }) => {
	let baseName = `image-${Date.now()}`;
	if (name) {
		const lastDot = name.lastIndexOf('.');
		baseName = lastDot > 0 ? name.slice(0, lastDot) : name;
	}

	const extension = MIME_TO_EXTENSION[type] ?? 'bin';
	if (extension === 'bin') {
		console.warn(`Unexpected mime type for image download: ${type}`);
	}

	return `${escapeFileName(baseName)}.${extension}`;
};

export const useSaveImage = (src: string) => {
	const filesRegistry = useFilesRegistry();

	const download = async () => {
		const fileId = getResourceIdInUrl(src);
		if (!fileId) return;

		const file = await filesRegistry.get(fileId);
		if (!file) {
			console.warn(`File with id: ${fileId} not found`);
			return;
		}

		const buffer = await file.arrayBuffer();

		await saveFile(buffer, buildDownloadFileName(file));
	};

	return download;
};

export const DownloadableContent = ({
	src,
	children,
}: {
	src: string;
	children: React.ReactNode;
}) => {
	const [isHover, setIsHover] = useState(false);
	const download = useSaveImage(src);

	return (
		<Box
			position="relative"
			onMouseEnter={() => setIsHover(true)}
			onMouseLeave={() => setIsHover(false)}
		>
			<Button
				onClick={download}
				position="absolute"
				top="15px"
				right="15px"
				visibility={isHover ? 'unset' : 'hidden'}
				size="sm"
				variant="floating"
			>
				<FaDownload />
			</Button>
			{children}
		</Box>
	);
};
