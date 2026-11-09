import { useCallback } from 'react';
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$isBlockElementNode,
	$isParagraphNode,
	$isTextNode,
	LexicalEditor,
} from 'lexical';
import { $createCodeNode } from '@lexical/code-core';
import {
	INSERT_CHECK_LIST_COMMAND,
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { $createHeadingNode, $createQuoteNode, $isHeadingNode } from '@lexical/rich-text';

import { $getCursorNode } from '../../utils/selection';
import { $canInsertElementsToNode, $wrapNodes } from '../../utils/tree';

import { CONVERT_TO_PARAGRAPH_COMMAND } from './ParagraphPlugin';
import { $restoreContextMenuSelection } from './selection';
import { ContextMenuBuilder } from './types';

export const useBlockMenu = (editor: LexicalEditor): ContextMenuBuilder =>
	useCallback<ContextMenuBuilder>(
		(context) => {
			return [
				{
					label: 'Paragraph',
					submenu: [
						{
							type: 'checkbox',
							label: 'Unordered list',
							checked: context.listType === 'bullet',
							click() {
								editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND);
							},
						},
						{
							type: 'checkbox',
							label: 'Ordered list',
							checked: context.listType === 'number',
							click() {
								editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND);
							},
						},
						{
							type: 'checkbox',
							label: 'Task list',
							checked: context.listType === 'check',
							click() {
								editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND);
							},
						},
						{ type: 'separator' },
						...([1, 2, 3, 4, 5, 6] as const).map((level) => ({
							label: `Heading ${level}`,
							type: 'checkbox' as const,
							checked: context.headingTag === `h${level}`,
							click() {
								editor.update(() => {
									const target = $getCursorNode();
									if (!target) return;

									const parent = target.getParent();
									if (parent && !$canInsertElementsToNode(parent))
										return;

									if ($isHeadingNode(parent)) {
										const currentLevel = Number(
											parent.getTag().slice(1),
										);
										parent.replace(
											currentLevel === level
												? $createParagraphNode()
												: $createHeadingNode(`h${level}`),
											true,
										);
										return;
									}

									const heading = $createHeadingNode(`h${level}`);
									if ($isTextNode(target)) {
										target.replace(heading);
										heading.append(target);
										heading.select();
									} else if (!parent) {
										$getRoot().append(heading);
										heading.select();
									} else {
										target.insertBefore(heading);
										heading.select();
									}
								});
							},
						})),
						{
							label: 'Body',
							click() {
								editor.update(() => {
									$restoreContextMenuSelection(context);
									editor.dispatchCommand(CONVERT_TO_PARAGRAPH_COMMAND);
								});
							},
						},
						{ type: 'separator' },
						{
							label: 'Quote',
							type: 'checkbox',
							checked: context.isQuote,
							click() {
								editor.update(() => {
									$restoreContextMenuSelection(context);
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
							checked: Boolean(context.codeBlock),
							click() {
								editor.update(() => {
									$restoreContextMenuSelection(context);
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
				},
			];
		},
		[editor],
	);
