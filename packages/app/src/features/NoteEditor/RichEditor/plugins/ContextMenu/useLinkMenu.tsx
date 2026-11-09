import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
	$createTextNode,
	$getNodeByKey,
	$getSelection,
	$insertNodes,
	$isNodeSelection,
	$isRangeSelection,
	LexicalEditor,
} from 'lexical';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { ContextMenu } from '@electron/requests/contextMenu';
import { useWorkspaceModal } from '@features/WorkspaceModal/useWorkspaceModal';
import {
	$createLinkNode,
	$isLinkNode,
	LinkNode,
	TOGGLE_LINK_COMMAND,
} from '@lexical/link';

import { LinkEditorDialog } from './LinkEditorDialog';
import { ContextMenuBuilder } from './types';

const $updateLink = (editor: LexicalEditor, linkNode: LinkNode, url: string | null) => {
	if (url === null || url.trim() === '') {
		const selection = $getSelection();
		const isCursorOnLink =
			($isRangeSelection(selection) || $isNodeSelection(selection)) &&
			selection.getNodes().every((node) => node.is(linkNode));

		if (!isCursorOnLink) linkNode.select();
		editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
		return;
	}

	linkNode.setURL(url);
};

export const useLinkMenu = (editor: LexicalEditor): ContextMenuBuilder => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features, {
		keyPrefix: 'contextMenu',
	});
	const modal = useWorkspaceModal();

	return useCallback<ContextMenuBuilder>(
		(context) => {
			const menu: ContextMenu = [
				{
					label: t('link.insert'),
					click() {
						modal.show({
							content: () => (
								<LinkEditorDialog
									isInsertionMode
									url=""
									title=""
									onSubmit={({ url, title }) => {
										editor.update(() => {
											const selection = $getSelection();
											if (!selection) return;

											if (
												$isRangeSelection(selection) &&
												selection.isCollapsed()
											) {
												const linkNode = $createLinkNode(url, {
													title,
												});
												linkNode.append($createTextNode(url));
												$insertNodes([linkNode]);
											} else {
												editor.dispatchCommand(
													TOGGLE_LINK_COMMAND,
													{ url },
												);
											}
										});
									}}
								/>
							),
						});
					},
				},
			];

			if (context.link) {
				const { key, url, title } = context.link;
				menu.push(
					{
						label: t('link.edit'),
						click() {
							modal.show({
								content: () => (
									<LinkEditorDialog
										url={url}
										title={title}
										onSubmit={({
											url: nextUrl,
											title: nextTitle,
										}) => {
											editor.update(() => {
												const node = $getNodeByKey(key);
												if (!$isLinkNode(node)) return;
												node.setURL(nextUrl);
												node.setTitle(nextTitle);
											});
										}}
									/>
								),
							});
						},
					},
					{
						label: t('link.remove'),
						click() {
							editor.update(() => {
								const node = $getNodeByKey(key);
								if ($isLinkNode(node)) $updateLink(editor, node, null);
							});
						},
					},
				);
			}

			return menu;
		},
		[editor, modal, t],
	);
};
