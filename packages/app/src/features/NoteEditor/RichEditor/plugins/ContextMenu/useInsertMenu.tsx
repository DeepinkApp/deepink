import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
	$createParagraphNode,
	$isBlockElementNode,
	$isRootNode,
	CONTROLLED_TEXT_INSERTION_COMMAND,
	LexicalEditor,
} from 'lexical';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { useWorkspaceModal } from '@features/WorkspaceModal/useWorkspaceModal';
import { useLocalizedDate } from '@hooks/useLocalizedDate';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { useAppSelector } from '@state/redux/hooks';
import { selectEditorDateFormat } from '@state/redux/settings/selectors/preferences';

import { $getCursorNode } from '../../utils/selection';
import { $getNearestSibling } from '../../utils/tree';

import { INSERT_FILES_COMMAND } from '../Files/FilesPlugin';
import { $createImageNode } from '../Image/ImageNode';
import { ImageEditorDialog } from './ImageEditorDialog';
import { $restoreContextMenuSelection } from './selection';
import { ContextMenuBuilder } from './types';

export const useInsertMenu = (editor: LexicalEditor): ContextMenuBuilder => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features, {
		keyPrefix: 'contextMenu',
	});
	const modal = useWorkspaceModal();
	const localizedDate = useLocalizedDate();
	const dateFormat = useAppSelector(selectEditorDateFormat);

	return useCallback<ContextMenuBuilder>(
		(context) => [
			{
				label: t('insert.label'),
				submenu: [
					{
						label: t('insert.option.date'),
						click() {
							editor.update(() => {
								$restoreContextMenuSelection(context);
								editor.dispatchCommand(
									CONTROLLED_TEXT_INSERTION_COMMAND,
									localizedDate(new Date(), dateFormat),
								);
							});
						},
					},
					{
						label: t('insert.option.separator'),
						click() {
							editor.dispatchCommand(
								INSERT_HORIZONTAL_RULE_COMMAND,
								undefined,
							);
						},
					},
					{
						label: t('insert.option.image'),
						click() {
							modal.show({
								content: () => (
									<ImageEditorDialog
										url=""
										altText=""
										onSubmit={({ url, altText }) => {
											editor.update(() => {
												const cursorNode = $getCursorNode();
												if (!cursorNode) return;

												const anchorNode =
													$getNearestSibling(cursorNode);
												if (!anchorNode) return;

												const imageNode = $createImageNode({
													src: url,
													altText,
												});
												if ($isBlockElementNode(anchorNode)) {
													const paragraphNode =
														$createParagraphNode();
													paragraphNode.append(imageNode);
													if ($isRootNode(anchorNode)) {
														anchorNode.append(paragraphNode);
													} else {
														anchorNode.insertAfter(
															paragraphNode,
														);
													}
												} else {
													anchorNode.insertAfter(imageNode);
												}
											});
										}}
									/>
								),
							});
						},
					},
					{
						label: t('insert.option.file'),
						click() {
							const input = document.createElement('input');
							input.type = 'file';
							input.multiple = true;
							input.addEventListener(
								'change',
								() => {
									const files = input.files;
									input.remove();

									if (files) {
										editor.dispatchCommand(INSERT_FILES_COMMAND, {
											files,
										});
									}
								},
								{ once: true },
							);
							input.click();
						},
					},
				],
			},
		],
		[dateFormat, editor, localizedDate, modal, t],
	);
};
