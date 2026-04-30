/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as React from 'react';
import { JSX, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	$getNodeByKey,
	$getSelection,
	$isNodeSelection,
	COMMAND_PRIORITY_LOW,
	createCommand,
	KEY_BACKSPACE_COMMAND,
	KEY_DELETE_COMMAND,
	LexicalCommand,
	NodeKey,
} from 'lexical';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { HStack, Spinner, Text } from '@chakra-ui/react';
import { getAppResourceDataInUrl } from '@core/features/links';
import { useFilesRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';

import { $isImageNode } from './ImageNode';

const imageCache = new Map<string, string | null>();

export const RIGHT_CLICK_IMAGE_COMMAND: LexicalCommand<MouseEvent> = createCommand(
	'RIGHT_CLICK_IMAGE_COMMAND',
);
export const LEFT_CLICK_IMAGE_COMMAND: LexicalCommand<MouseEvent> = createCommand(
	'LEFT_CLICK_IMAGE_COMMAND',
);

function useSuspenseImage(src: string) {
	const filesRegistry = useFilesRegistry();

	if (!imageCache.has(src)) {
		// eslint-disable-next-line @typescript-eslint/only-throw-error
		throw new Promise(async (resolve, reject) => {
			let actualSrc = src;

			const resourceData = getAppResourceDataInUrl(src);
			if (resourceData) {
				if (resourceData.type !== 'resource') {
					imageCache.set(src, null);
					reject(new Error('Not a resource type'));
					return;
				}

				const file = await filesRegistry.get(resourceData.id);
				if (!file) {
					imageCache.set(src, null);
					reject(new Error('File not found'));
					return;
				}

				actualSrc = URL.createObjectURL(new Blob([file], { type: file.type }));
			}

			const img = new Image();
			img.src = actualSrc;
			img.onload = () => {
				imageCache.set(src, actualSrc);
				resolve(null);
			};
			img.onerror = () => {
				imageCache.set(src, null);
				reject(new Error('Failed to load image'));
			};
		});
	}

	return imageCache.get(src) ?? src;
}

export const LazyImage = React.forwardRef<
	HTMLImageElement,
	{
		altText: string;
		className?: string | null;
		height: 'inherit' | number;
		maxWidth?: number;
		src: string;
		width: 'inherit' | number;
		onError: () => void;
		onLoad?: () => void;
	}
>(
	(
		{ altText, className, src, width, height, maxWidth, onError, onLoad },
		ref,
	): JSX.Element => {
		const url = useSuspenseImage(src);

		return (
			<img
				ref={ref}
				className={className || undefined}
				src={url}
				alt={altText}
				style={{
					height,
					maxWidth,
					width,
					objectFit: 'contain',
				}}
				onError={onError}
				onLoad={onLoad}
				draggable="false"
			/>
		);
	},
);

function BrokenImage(): JSX.Element {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);
	return <div>{t('image.brokenImage')}</div>;
}

function ImageLoadingFallback(): JSX.Element {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);
	return (
		<HStack>
			<Text>{t('image.loading')}</Text> <Spinner />
		</HStack>
	);
}

export default function ImageComponent({
	src,
	altText,
	nodeKey,
	width,
	height,
	maxWidth,
}: {
	nodeKey: NodeKey;
	src: string;
	altText: string;
	width: 'inherit' | number;
	height: 'inherit' | number;
	maxWidth?: number;
}): JSX.Element {
	const containerRef = useRef<null | HTMLImageElement>(null);

	const [editor] = useLexicalComposerContext();
	const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);

	const [isLoadError, setIsLoadError] = useState<boolean>(false);
	useEffect(() => {
		setIsLoadError(false);
	}, [src]);

	const $onDelete = useCallback(
		(payload: KeyboardEvent) => {
			const deleteSelection = $getSelection();
			if (isSelected && $isNodeSelection(deleteSelection)) {
				const event: KeyboardEvent = payload;
				event.preventDefault();
				editor.update(() => {
					deleteSelection.getNodes().forEach((node) => {
						if ($isImageNode(node)) {
							node.remove();
						}
					});
				});
			}
			return false;
		},
		[editor, isSelected],
	);

	const onImageClick = useCallback((payload: MouseEvent) => {
		const event = payload;

		if (
			containerRef.current &&
			event.target instanceof Node &&
			containerRef.current.contains(event.target)
		) {
			containerRef.current.requestFullscreen();
			return true;
		}

		return false;
	}, []);

	useEffect(() => {
		const unregister = mergeRegister(
			editor.registerCommand<MouseEvent>(
				LEFT_CLICK_IMAGE_COMMAND,
				onImageClick,
				COMMAND_PRIORITY_LOW,
			),
			editor.registerCommand(KEY_DELETE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW),
			editor.registerCommand(
				KEY_BACKSPACE_COMMAND,
				$onDelete,
				COMMAND_PRIORITY_LOW,
			),
		);

		return () => {
			unregister();
		};
	}, [
		clearSelection,
		editor,
		isSelected,
		nodeKey,
		$onDelete,
		setSelected,
		onImageClick,
	]);

	const markDirty = useCallback(() => {
		editor.update(() => {
			const node = $getNodeByKey(nodeKey);
			if (node) {
				node.markDirty();
			}
		});
	}, [editor, nodeKey]);

	useEffect(() => {
		markDirty();
	}, [isLoadError, markDirty]);

	return (
		<div
			ref={containerRef}
			draggable={false}
			onContextMenu={(event) => {
				editor.getEditorState().read(() => {
					editor.dispatchCommand(RIGHT_CLICK_IMAGE_COMMAND, event.nativeEvent);
				});
			}}
			onClick={(event) => {
				if (!(event.target instanceof HTMLImageElement)) return;
				if (event.button !== 0) return;

				editor.getEditorState().read(() => {
					editor.dispatchCommand(LEFT_CLICK_IMAGE_COMMAND, event.nativeEvent);
				});
			}}
		>
			<Suspense fallback={<ImageLoadingFallback />}>
				{isLoadError ? (
					<BrokenImage />
				) : (
					<LazyImage
						src={src}
						altText={altText}
						width={width}
						height={height}
						maxWidth={maxWidth}
						onError={() => setIsLoadError(true)}
						onLoad={markDirty}
					/>
				)}
			</Suspense>
		</div>
	);
}
