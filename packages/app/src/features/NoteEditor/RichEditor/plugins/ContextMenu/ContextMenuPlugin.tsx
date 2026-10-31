import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import copy from 'copy-to-clipboard';
import {
	$createParagraphNode,
	$createTextNode,
	$findMatchingParent,
	$getEditor,
	$getNearestNodeFromDOMNode,
	$getRoot,
	$getSelection,
	$insertNodes,
	$isBlockElementNode,
	$isInlineFormattable,
	$isNodeSelection,
	$isParagraphNode,
	$isRangeSelection,
	$isRootNode,
	$isTextNode,
	$setSelection,
	CONTROLLED_TEXT_INSERTION_COMMAND,
	FORMAT_TEXT_COMMAND,
	LexicalEditor,
	LexicalNode,
	SET_TEXT_FORMAT_COMMAND,
	TextFormatType,
} from 'lexical';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { isResourceUrl } from '@core/features/links';
import { ContextMenu } from '@electron/requests/contextMenu';
import { getContextMenuCoords } from '@electron/requests/contextMenu/renderer';
import { useWorkspaceModal } from '@features/WorkspaceModal/useWorkspaceModal';
import { useAppContextMenu } from '@hooks/useAppContextMenu';
import { useFileSaver } from '@hooks/useFileSaver';
import { useLocalizedDate } from '@hooks/useLocalizedDate';
import { $createCodeNode, $isCodeNode } from '@lexical/code-core';
import { CODE_LANGUAGE_FRIENDLY_NAME_MAP, CODE_LANGUAGE_MAP } from '@lexical/code-prism';
import {
	$createLinkNode,
	$isLinkNode,
	LinkNode,
	TOGGLE_LINK_COMMAND,
} from '@lexical/link';
import {
	$isListNode,
	INSERT_CHECK_LIST_COMMAND,
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import {
	$createHeadingNode,
	$createQuoteNode,
	$isHeadingNode,
	$isQuoteNode,
} from '@lexical/rich-text';
import { useAppSelector } from '@state/redux/hooks';
import { selectEditorDateFormat } from '@state/redux/settings/selectors/preferences';
import { useWorkspaceActions } from '@state/redux/vaults/hooks';

import { $getCursorNode } from '../../utils/selection';
import {
	$canInsertElementsToNode,
	$getNearestSibling,
	$wrapNodes,
} from '../../utils/tree';

import { INSERT_FILES_COMMAND } from '../Files/FilesPlugin';
import { $createImageNode, $isImageNode } from '../Image/ImageNode';
import { ImageEditorDialog } from './ImageEditorDialog';
import { LinkEditorDialog } from './LinkEditorDialog';
import { CONVERT_TO_PARAGRAPH_COMMAND, ParagraphPlugin } from './ParagraphPlugin';

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

	const localizedDate = useLocalizedDate();
	const dateFormat = useAppSelector(selectEditorDateFormat);

	const { setSearch } = useWorkspaceActions();
	const dispatch = useDispatch();

	const saveFile = useFileSaver();

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

				const selection = $getSelection();
				const $restoreSelection = () =>
					selection && $setSelection(selection.clone());

				const menu: ContextMenu = [];

				// TODO: add option to mention another note
				menu.push({
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
				});

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

				const linkUrl = linkNode?.getURL().trim() ?? null;
				if (linkUrl)
					menu.push({
						label: 'Copy Link',
						click() {
							copy(linkUrl);
						},
					});

				const imageUrl = imageNode?.getSrc().trim() ?? null;
				if (imageUrl) {
					menu.push({
						label: 'Copy Image Link',
						click() {
							copy(imageUrl);
						},
					});

					if (isResourceUrl(imageUrl))
						menu.push({
							label: 'Download image',
							click() {
								saveFile(imageUrl);
							},
						});
				}

				const searchText = selection?.getTextContent().trim() ?? '';
				if (searchText.length > 0)
					menu.push({
						label: `Search for "${searchText.slice(0, 15)}"`,
						click() {
							dispatch(setSearch({ search: searchText }));
						},
					});

				// Formatting
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

				const listNode = $findMatchingParent(lexicalNode, $isListNode);
				menu.push({
					label: 'Paragraph',
					submenu: [
						{
							type: 'checkbox',
							label: 'Unordered list',
							checked: Boolean(
								listNode && listNode.getListType() === 'bullet',
							),
							click() {
								editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND);
							},
						},
						{
							type: 'checkbox',
							label: 'Ordered list',
							checked: Boolean(
								listNode && listNode.getListType() === 'number',
							),
							click() {
								editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND);
							},
						},
						{
							type: 'checkbox',
							label: 'Task list',
							checked: Boolean(
								listNode && listNode.getListType() === 'check',
							),
							click() {
								editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND);
							},
						},
						{ type: 'separator' },
						...([1, 2, 3, 4, 5, 6] as const).map((level) => {
							return {
								label: `Heading ${level}`,
								type: 'checkbox',
								checked:
									$isHeadingNode(lexicalNode) &&
									lexicalNode.getTag() === `h${level}`,
								click() {
									editor.update(() => {
										const target = $getCursorNode();
										if (!target) return;

										const parent = target.getParent();
										if (parent && !$canInsertElementsToNode(parent))
											return;

										// Update existing heading (toggle to paragraph or change level)
										if ($isHeadingNode(parent)) {
											const currentHeadingLevel = Number(
												parent.getTag().slice(1),
											);
											if (currentHeadingLevel === level) {
												parent.replace(
													$createParagraphNode(),
													true,
												);
											} else {
												parent.replace(
													$createHeadingNode(`h${level}`),
													true,
												);
											}

											return;
										}

										// Insert
										const heading = $createHeadingNode(`h${level}`);
										if ($isTextNode(target)) {
											target.replace(heading);
											heading.append(target);
											heading.select();
										} else {
											// Insert at root
											if (!parent) {
												$getRoot().append(heading);
												heading.select();
												return;
											}

											// Insert before
											target.insertBefore(heading);
											heading.select();
										}
									});
								},
							} as const;
						}),
						{
							label: 'Body',
							click() {
								editor.update(() => {
									$restoreSelection();
									editor.dispatchCommand(CONVERT_TO_PARAGRAPH_COMMAND);
								});
							},
						},
						{ type: 'separator' },
						{
							label: 'Quote',
							type: 'checkbox',
							checked: Boolean(
								$findMatchingParent(lexicalNode, $isQuoteNode),
							),
							click() {
								editor.update(() => {
									$restoreSelection();
									$wrapNodes((nodes) => {
										const quote = $createQuoteNode();

										if (nodes.length === 0) {
											const paragraph = $createParagraphNode();
											quote.append(paragraph);
											paragraph.select();
										} else {
											quote.append(
												...nodes.map((node) => {
													if ($isParagraphNode(node))
														return node;

													const paragraph =
														$createParagraphNode();
													paragraph.append(node);
													return paragraph;
												}),
											);
										}

										return quote;
									});
								});
							},
						},
						{
							label: 'Code block',
							type: 'checkbox',
							checked: Boolean(
								$findMatchingParent(lexicalNode, $isCodeNode),
							),
							click() {
								editor.update(() => {
									$restoreSelection();
									$wrapNodes((nodes) => {
										const code = $createCodeNode();

										const textContent = nodes
											.map(
												(node, index) =>
													($isBlockElementNode(node) &&
													index > 0
														? '\n'
														: '') + node.getTextContent(),
											)
											.join('');
										nodes.forEach((node) => node.remove());

										code.append($createTextNode(textContent));
										code.select();

										return code;
									});
								});
							},
						},
					],
				});

				menu.push({
					label: t('insert.label'),
					submenu: [
						{
							label: t('insert.option.date'),
							click() {
								editor.update(() => {
									$restoreSelection();
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
															anchorNode.append(
																paragraphNode,
															);
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
												files: files,
											});
										}
									},
									{ once: true },
								);

								input.click();
							},
						},
					],
				});

				const codeNode = $findMatchingParent(lexicalNode, $isCodeNode);
				if (codeNode) {
					const currentLanguage = editor.read(() =>
						codeNode.getLanguage()?.toLowerCase(),
					);
					menu.push({
						label: 'Code block language',
						submenu: Object.entries(CODE_LANGUAGE_FRIENDLY_NAME_MAP).map(
							([language, label]) => {
								let checked = false;
								if (currentLanguage === language) checked = true;
								else if (
									currentLanguage &&
									language === CODE_LANGUAGE_MAP[currentLanguage]
								)
									checked = true;

								return {
									type: 'checkbox',
									label,
									checked,
									click() {
										editor.update(() => {
											codeNode.setLanguage(language);
										});
									},
								} as const;
							},
						),
					});
				}

				const isTextSelected = (selection?.getTextContent().length ?? 0) > 0;
				menu.push(
					{ type: 'separator' },
					{
						label: 'Cut',
						role: 'cut',
						enabled: isTextSelected,
					},
					{
						label: 'Copy',
						role: 'copy',
						enabled: isTextSelected,
					},
					{
						label: 'Paste',
						role: 'paste',
					},
					{
						label: 'Select all',
						role: 'selectAll',
					},
				);

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
	}, [
		dateFormat,
		dispatch,
		editor,
		localizedDate,
		modal,
		saveFile,
		setSearch,
		showMenu,
		t,
	]);

	return (
		<>
			<ParagraphPlugin />
		</>
	);
};
