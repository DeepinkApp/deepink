import React, { Ref, useEffect, useMemo } from 'react';
import { $createRangeSelection, $getRoot, $getSelection, $setSelection } from 'lexical';
import { Box, BoxProps, useSlotRecipe } from '@chakra-ui/react';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { useAppSelector } from '@state/redux/hooks';
import {
	selectEditorConfig,
	selectEditorFontFamily,
} from '@state/redux/settings/selectors/preferences';
import { setRef } from '@utils/react/setRef';

import { CodeHighlightPlugin } from './plugins/CodeHighlightPlugin';
import { GenericContextMenu } from './plugins/ContextMenu/components/GenericContextMenu';
import { ContextMenuPlugin } from './plugins/ContextMenu/ContextMenuPlugin';
import { EditorPanelPlugin } from './plugins/EditorPanelPlugin/EditorPanelPlugin';
import { DropFilesPlugin } from './plugins/Files/DropFilesPlugin';
import { FilesPlugin } from './plugins/Files/FilesPlugin';
import { FormattingPlugin } from './plugins/Formatting/FormattingPlugin';
import { HighlightingPlugin } from './plugins/HighlightingPlugin/HighlightingPlugin';
import ImagesPlugin from './plugins/Image/ImagesPlugin';
import { LinkClickHandlerPlugin } from './plugins/LinkClickHandlerPlugin';
import {
	MarkdownSerializePlugin,
	MarkdownSerializePluginProps,
} from './plugins/Markdown/MarkdownSerializePlugin';
import { MarkdownShortcutPlugin } from './plugins/Markdown/MarkdownShortcutPlugin';
import { ReadOnlyPlugin } from './plugins/ReadOnlyPlugin';

export type RichEditorAPI = {
	focus(): void;
};

export type RichEditorContentProps = BoxProps &
	MarkdownSerializePluginProps & {
		placeholder?: string;
		isReadOnly?: boolean;
		search?: string;
		apiRef?: Ref<RichEditorAPI>;
	};

export const RichEditorContent = ({
	value,
	onChanged,
	placeholder,
	isReadOnly,
	search,
	apiRef,
	...props
}: RichEditorContentProps) => {
	const recipe = useSlotRecipe({ key: 'richEditor' });
	const styles = recipe();
	const editorConfig = useAppSelector(selectEditorConfig);
	const fontFamily = useAppSelector(selectEditorFontFamily);

	// Expose API
	const [editor] = useLexicalComposerContext();
	const api = useMemo(() => {
		return {
			focus() {
				editor.update(() => {
					// Do not change selection if exists
					if ($getSelection()) return;

					// Set cursor at content start
					const rootKey = $getRoot().getKey();
					const selection = $createRangeSelection();
					selection.anchor.set(rootKey, 0, 'element');
					selection.focus.set(rootKey, 0, 'element');
					$setSelection(selection);
				});

				editor.focus();
			},
		} satisfies RichEditorAPI;
	}, [editor]);

	useEffect(() => {
		return setRef(apiRef ?? null, api);
	}, [api, apiRef]);

	return (
		<Box
			position="relative"
			display="flex"
			width="100%"
			height="100%"
			overflow="auto"
			css={{
				...styles.root,

				// TODO: move a styles to a top level container
				fontSize: editorConfig.fontSize,

				fontFamily: fontFamily,
				lineHeight: editorConfig.lineHeight,
			}}
		>
			<ContextMenuPlugin renderer={GenericContextMenu} />
			<RichTextPlugin
				contentEditable={
					<Box
						w="100%"
						maxH="100%"
						outline="none"
						padding="1rem 1rem 5rem"
						overflow="auto"
						{...props}
						asChild
					>
						<ContentEditable />
					</Box>
				}
				placeholder={
					placeholder ? (
						<Box
							position="absolute"
							top={0}
							left={0}
							right={0}
							bottom={0}
							padding="1rem 1rem 5rem"
							pointerEvents="none"
							color="typography.secondary"
						>
							{placeholder}
						</Box>
					) : undefined
				}
				ErrorBoundary={LexicalErrorBoundary}
			/>
			<MarkdownSerializePlugin value={value} onChanged={onChanged} />
			<MarkdownShortcutPlugin />
			<FormattingPlugin />
			<ImagesPlugin />
			<CodeHighlightPlugin />
			<LinkPlugin />
			<LinkClickHandlerPlugin />
			<FilesPlugin />
			<DropFilesPlugin />
			<EditorPanelPlugin />
			<HistoryPlugin />
			<TabIndentationPlugin />
			<ListPlugin />
			<CheckListPlugin />
			<TablePlugin />
			<HorizontalRulePlugin />
			<HighlightingPlugin search={search} />
			<ReadOnlyPlugin readonly={isReadOnly ?? false} />
		</Box>
	);
};
