import { useCallback } from 'react';
import {
	FORMAT_TEXT_COMMAND,
	LexicalEditor,
	SET_TEXT_FORMAT_COMMAND,
	TextFormatType,
} from 'lexical';

import { $restoreContextMenuSelection } from './selection';
import { ContextMenuBuilder } from './types';

export const useFormattingMenu = (editor: LexicalEditor): ContextMenuBuilder =>
	useCallback<ContextMenuBuilder>(
		(context) => {
			if (!context.canFormatSelection) return [];

			const formatSelectedText = (format: TextFormatType) => {
				editor.update(() => {
					$restoreContextMenuSelection(context);
					editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
				});
			};

			return [
				{
					label: 'Format',
					submenu: [
						{ label: 'Bold', click: () => formatSelectedText('bold') },
						{ label: 'Italic', click: () => formatSelectedText('italic') },
						{
							label: 'Strikethrough',
							click: () => formatSelectedText('strikethrough'),
						},
						{ label: 'Code', click: () => formatSelectedText('code') },
						{ type: 'separator' },
						{
							label: 'Clear formatting',
							click() {
								editor.update(() => {
									$restoreContextMenuSelection(context);
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
				},
			];
		},
		[editor],
	);
