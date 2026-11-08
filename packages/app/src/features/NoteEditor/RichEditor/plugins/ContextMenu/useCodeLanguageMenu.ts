import { useCallback } from 'react';
import { $getNodeByKey, LexicalEditor } from 'lexical';
import { $isCodeNode } from '@lexical/code-core';
import { CODE_LANGUAGE_FRIENDLY_NAME_MAP, CODE_LANGUAGE_MAP } from '@lexical/code-prism';

import { ContextMenuBuilder } from './types';

export const useCodeLanguageMenu = (editor: LexicalEditor): ContextMenuBuilder =>
	useCallback<ContextMenuBuilder>(
		(context) => {
			if (!context.codeBlock) return [];

			const { key, language: currentLanguage } = context.codeBlock;
			return [
				{
					label: 'Code block language',
					submenu: Object.entries(CODE_LANGUAGE_FRIENDLY_NAME_MAP).map(
						([language, label]) => {
							const checked =
								currentLanguage === language ||
								Boolean(
									currentLanguage &&
									language === CODE_LANGUAGE_MAP[currentLanguage],
								);

							return {
								type: 'checkbox' as const,
								label,
								checked,
								click() {
									editor.update(() => {
										const node = $getNodeByKey(key);
										if ($isCodeNode(node)) node.setLanguage(language);
									});
								},
							} as const;
						},
					),
				},
			];
		},
		[editor],
	);
