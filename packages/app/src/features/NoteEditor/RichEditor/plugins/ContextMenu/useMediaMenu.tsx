import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { $getNodeByKey, LexicalEditor } from 'lexical';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { ContextMenu } from '@electron/requests/contextMenu';
import { useWorkspaceModal } from '@features/WorkspaceModal/useWorkspaceModal';

import { $isImageNode } from '../Image/ImageNode';
import { ImageEditorDialog } from './ImageEditorDialog';
import { ContextMenuBuilder } from './types';

export const useMediaMenu = (editor: LexicalEditor): ContextMenuBuilder => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features, {
		keyPrefix: 'contextMenu',
	});
	const modal = useWorkspaceModal();

	return useCallback<ContextMenuBuilder>(
		(context) => {
			if (!context.image) return [];

			const { key, url, altText } = context.image;
			const menu: ContextMenu = [
				{
					label: t('image.edit'),
					click() {
						modal.show({
							content: () => (
								<ImageEditorDialog
									url={url}
									altText={altText}
									onSubmit={({
										url: nextUrl,
										altText: nextAltText,
									}) => {
										editor.update(() => {
											const node = $getNodeByKey(key);
											if (!$isImageNode(node)) return;
											node.setSrc(nextUrl);
											node.setAltText(nextAltText);
										});
									}}
								/>
							),
						});
					},
				},
				// TODO: implement this feature
				{ label: t('image.download') },
			];

			return menu;
		},
		[editor, modal, t],
	);
};
