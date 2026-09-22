import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { $getSelection, $isNodeSelection, $isRangeSelection } from 'lexical';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $findMatchingParent } from '@lexical/utils';

import { $isImageNode } from '../../Image/ImageNode';

import { ContextMenuRendererProps } from '../ContextMenuPlugin';
import { LinkEditor } from './LinkEditor';
import { ObjectPropertiesEditor } from './ObjectPropertiesEditor';

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
