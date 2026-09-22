import React, { FC, useCallback, useRef } from 'react';
import FocusLock, { MoveFocusInside } from 'react-focus-lock';
import { useTranslation } from 'react-i18next';
import { FaCheck, FaLinkSlash } from 'react-icons/fa6';
import { $getSelection, $isNodeSelection, $isRangeSelection } from 'lexical';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Card, Group, Input } from '@chakra-ui/react';
import { IconButton } from '@components/IconButton';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $findMatchingParent } from '@lexical/utils';

import { $isImageNode } from '../../Image/ImageNode';

import { ContextMenuRendererProps } from '../ContextMenuPlugin';
import { ObjectPropertiesEditor } from './ObjectPropertiesEditor';

export const LinkEditor = ({
	url,
	onChange,
	onUnlink,
	onClose,
}: {
	url: string;
	onChange: (url: string) => void;
	onUnlink: () => void;
	onClose: () => void;
}) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const updateUrl = useCallback(() => {
		const value = inputRef.current?.value;
		if (value !== undefined) {
			onChange(value);
		}
		onClose();
	}, [onChange, onClose]);
	return (
		<FocusLock>
			<Card.Root
				css={{
					backgroundColor: 'surface.background',
				}}
				boxShadow="outline"
				borderRadius="12px"
			>
				<Card.Body padding=".5rem">
					<MoveFocusInside>
						<form onSubmit={updateUrl} aria-label="Link props editor">
							<Group>
								<Input
									ref={inputRef}
									placeholder="Link URL"
									defaultValue={url}
									size="sm"
								/>
								<IconButton
									size="sm"
									variant="accent"
									icon={<FaCheck />}
									title="Update URL"
									onClick={updateUrl}
								/>
								<IconButton
									size="sm"
									variant="subtle"
									icon={<FaLinkSlash />}
									title="Convert link to text"
									onClick={() => {
										onUnlink();
										onClose();
									}}
								/>
							</Group>
						</form>
					</MoveFocusInside>
				</Card.Body>
			</Card.Root>
		</FocusLock>
	);
};

export const GenericContextMenu: FC<ContextMenuRendererProps> = ({
	node,
	editor,
	close,
}) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);

	return editor.read(() => {
		if ($isImageNode(node)) {
			return (
				<ObjectPropertiesEditor
					title={t('contextMenu.imageProperties.title')}
					onClose={close}
					options={[
						{
							id: 'url',
							value: node.getSrc(),
							label: t('contextMenu.imageProperties.urlLabel'),
						},
						{
							id: 'alt',
							value: node.getAltText() ?? '',
							label: t('contextMenu.imageProperties.altLabel'),
						},
					]}
					onUpdate={(update) => {
						const { url, alt } = update;
						editor.update(() => {
							node.setSrc(url);
							node.setAltText(alt);
						});
						close();
					}}
				/>
			);
		}

		const linkNode = $isLinkNode(node)
			? node
			: $findMatchingParent(node, (node) => $isLinkNode(node));
		if ($isLinkNode(linkNode)) {
			const updateLink = (url: string | null) => {
				editor.update(() => {
					// Remove link
					if (url === null || url.trim() === '') {
						const selection = $getSelection();

						let isCursorOnLink = false;
						if ($isRangeSelection(selection) || $isNodeSelection(selection)) {
							isCursorOnLink = selection
								.getNodes()
								.every((node) => node.is(linkNode));
						}

						if (!isCursorOnLink) linkNode.select();

						editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
						return;
					}

					linkNode.setURL(url);
				});
			};

			return (
				<LinkEditor
					url={linkNode.getURL()}
					onChange={updateLink}
					onUnlink={() => updateLink(null)}
					onClose={close}
				/>
			);
		}

		return null;
	});
};
