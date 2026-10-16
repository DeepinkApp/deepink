import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
	$findMatchingParent,
	$getEditor,
	$getNearestNodeFromDOMNode,
	$getSelection,
	$isInlineFormattable,
	$isNodeSelection,
	$isRangeSelection,
	$setSelection,
	FORMAT_TEXT_COMMAND,
	LexicalEditor,
	LexicalNode,
	SET_TEXT_FORMAT_COMMAND,
	TextFormatType,
} from 'lexical';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { ContextMenu } from '@electron/requests/contextMenu';
import { getContextMenuCoords } from '@electron/requests/contextMenu/renderer';
import { useWorkspaceModal } from '@features/WorkspaceModal/useWorkspaceModal';
import { useAppContextMenu } from '@hooks/useAppContextMenu';
import { $isCodeNode } from '@lexical/code-core';
import { CODE_LANGUAGE_FRIENDLY_NAME_MAP } from '@lexical/code-prism';
import { $isLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $isListNode } from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import { $isImageNode } from '../Image/ImageNode';
import { ImageEditorDialog } from './ImageEditorDialog';
import { LinkEditorDialog } from './LinkEditorDialog';

export type ContextMenuRendererProps = {
	node: LexicalNode;
	element: Element;
	editor: LexicalEditor;
	close: () => void;
};

const $updateLink = (linkNode: LinkNode, url: string | null) => {
	const editor = $getEditor();

	// Remove link
	if (url === null || url.trim() === '') {
		const selection = $getSelection();

		let isCursorOnLink = false;
		if ($isRangeSelection(selection) || $isNodeSelection(selection)) {
			isCursorOnLink = selection.getNodes().every((node) => node.is(linkNode));
		}

		if (!isCursorOnLink) linkNode.select();

		editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
		return;
	}

	linkNode.setURL(url);
};

export const ContextMenuPlugin = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features, { keyPrefix: 'contextMenu' });

	const [editor] = useLexicalComposerContext();

	const modal = useWorkspaceModal();

	const showMenu = useAppContextMenu();

	// Trigger context menu
	useEffect(() => {
		const rootElement = editor.getRootElement();
		if (!rootElement) return;

		const onContextMenu = (evt: MouseEvent) => {
			const menu = editor.read(() => {
				const target = evt.target as HTMLElement;

				const lexicalNode = $getNearestNodeFromDOMNode(target);
				if (!lexicalNode) return;

				const rootElement = editor.getElementByKey(lexicalNode.getKey());
				if (!rootElement) return;

				const menu: ContextMenu = [];

				console.log({ lexicalNode, target, evt });

				const linkNode = $findMatchingParent(lexicalNode, $isLinkNode);
				if (linkNode) {
					const linkProps = editor.read(() => ({
						url: linkNode.getURL(),
						title: linkNode.getTitle() ?? '',
					}));

					menu.push(
						{
							label: t('link.edit'),
							click() {
								modal.show({
									content: () => (
										<LinkEditorDialog
											{...linkProps}
											onSubmit={({ url, title }) => {
												editor.update(() => {
													linkNode.setURL(url);
													linkNode.setTitle(title);
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
									$updateLink(linkNode, null);
								});
							},
						},
					);
				}

				const imageNode = $findMatchingParent(lexicalNode, $isImageNode);
				if (imageNode) {
					const propsToEdit = editor.read(() => ({
						url: imageNode.getSrc(),
						altText: imageNode.getAltText(),
					}));

					menu.push({
						label: t('image.edit'),
						click() {
							modal.show({
								content: () => (
									<ImageEditorDialog
										{...propsToEdit}
										onSubmit={({ url, altText }) => {
											editor.update(() => {
												imageNode.setSrc(url);
												imageNode.setAltText(altText);
											});
										}}
									/>
								),
							});
						},
					});

					// TODO: implement this feature
					menu.push({
						label: t('image.download'),
					});
				}

				menu.push({
					label: 'Insert',
					submenu: [
						{ label: 'Current date' },
						{ label: 'File...' },
						{ label: 'Table' },
					],
				});

				// Formatting
				const selection = $getSelection();
				if (
					// User must select some text
					selection &&
					selection.getTextContent().length > 0 &&
					// And click on formattable node
					selection
						.getNodes()
						.some(
							(node) =>
								$findMatchingParent(node, $isInlineFormattable) &&
								!$findMatchingParent(node, (node) => $isCodeNode(node)),
						)
				) {
					const $restoreSelection = () => $setSelection(selection.clone());
					const formatSelectedText = (format: TextFormatType) => {
						editor.update(() => {
							$restoreSelection();
							editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
						});
					};
					menu.push({
						label: 'Format',
						submenu: [
							{
								label: 'Bold',
								click() {
									formatSelectedText('bold');
								},
							},
							{
								label: 'Italic',
								click() {
									formatSelectedText('italic');
								},
							},
							{
								label: 'Strikethrough',
								click() {
									formatSelectedText('strikethrough');
								},
							},
							{
								label: 'Code',
								click() {
									formatSelectedText('code');
								},
							},
							{ type: 'separator' },
							{
								label: 'Clear formatting',
								click() {
									editor.update(() => {
										$restoreSelection();
										editor.dispatchCommand(SET_TEXT_FORMAT_COMMAND, {
											bold: false,
											code: false,
											underline: false,
											strikethrough: false,
											italic: false,
											highlight: false,
											subscript: false,
											superscript: false,
											lowercase: false,
											uppercase: false,
											capitalize: false,
										} satisfies Record<TextFormatType, boolean>);
									});
								},
							},
						],
					});
				}

				menu.push({
					label: 'Block type',
					submenu: [
						{ label: 'Paragraph' },
						{ label: 'Code block' },
						{ label: 'Quote' },
					],
				});

				const listNode = $findMatchingParent(lexicalNode, $isListNode);
				if (listNode)
					menu.push({
						label: 'List type',
						submenu: [
							{
								type: 'checkbox',
								label: 'Unordered list',
							},
							{
								type: 'checkbox',
								label: 'Ordered list',
							},
							{ type: 'checkbox', label: 'Task list' },
						],
					});

				const codeNode = $findMatchingParent(lexicalNode, $isCodeNode);
				if (codeNode) {
					const currentLanguage = editor.read(() => codeNode.getLanguage());
					menu.push({
						label: 'Code block language',
						submenu: Object.entries(CODE_LANGUAGE_FRIENDLY_NAME_MAP).map(
							([language, label]) => ({
								type: 'checkbox',
								label,
								checked: currentLanguage === language,
								click() {
									editor.update(() => {
										codeNode.setLanguage(language);
									});
								},
							}),
						),
					});
				}

				return menu;
			});

			if (!menu) return;

			evt.preventDefault();

			showMenu(menu, getContextMenuCoords(evt));
		};

		rootElement.addEventListener('contextmenu', onContextMenu, { capture: true });
		return () => {
			rootElement.removeEventListener('contextmenu', onContextMenu, {
				capture: true,
			});
		};
	}, [editor, modal, showMenu, t]);

	return null;
};
