import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Box, HStack, Separator } from '@chakra-ui/react';
import { useFilesRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { useAppSelector } from '@state/redux/hooks';
import { selectEditorMode } from '@state/redux/settings/settings';
import { useWorkspaceSelector } from '@state/redux/vaults/hooks';
import { selectSearch } from '@state/redux/vaults/vaults';

import { FileUploader } from '../MonakoEditor/features/useDropFiles';
import { MonacoAPI, MonacoEditor } from '../MonakoEditor/MonacoEditor';
import { EditorPanelContext } from './EditorPanel';
import { EditorPanel } from './EditorPanel/EditorPanel';
import { RichEditor } from './RichEditor/RichEditor';
import { RichEditorAPI } from './RichEditor/RichEditorContent';

export const NoteEditor = ({
	text,
	setText,
	isReadOnly,
	isActive,
}: {
	text: string;
	setText: (text: string) => void;
	isReadOnly?: boolean;
	isActive?: boolean;
}) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);
	const editorMode = useAppSelector(selectEditorMode);
	const search = useWorkspaceSelector(selectSearch);

	const filesRegistry = useFilesRegistry();
	const uploadFile: FileUploader = useCallback(
		async (file) => {
			return filesRegistry.add(file);
		},
		[filesRegistry],
	);

	const monacoRef = useRef<MonacoAPI>(null);
	const richEditorApi = useRef<RichEditorAPI>(null);
	const focusEditor = useCallback(async () => {
		const monaco = monacoRef.current;
		if (monaco) {
			monaco.focus();
			return;
		}

		const richEditor = richEditorApi.current;
		if (richEditor) {
			richEditor.focus();
			return;
		}
	}, []);

	useEffect(() => {
		if (!isActive) return;

		focusEditor();
	}, [focusEditor, isActive, editorMode]);

	return (
		<EditorPanelContext>
			{!isReadOnly && (
				<HStack align="start" w="100%" overflowX="auto" flexShrink={0}>
					<EditorPanel />
				</HStack>
			)}
			<HStack
				css={{
					display: 'flex',
					width: '100%',
					height: '100%',
					overflow: 'hidden',
				}}
			>
				{(editorMode === 'plaintext' || editorMode === 'split-screen') && (
					<Box
						flexGrow="100"
						width="100%"
						height="100%"
						minW="0"
						css={{
							'& > *': {
								height: '100%',
							},
						}}
					>
						<MonacoEditor
							value={text}
							setValue={setText}
							uploadFile={uploadFile}
							isReadOnly={isReadOnly}
							apiRef={monacoRef}
						/>
					</Box>
				)}
				{editorMode === 'split-screen' && <Separator orientation="vertical" />}
				{(editorMode === 'richtext' || editorMode === 'split-screen') && (
					<RichEditor
						placeholder={t('note.editor.placeholder')}
						value={text}
						onChanged={setText}
						isReadOnly={isReadOnly}
						search={search || undefined}
						apiRef={richEditorApi}
					/>
				)}
			</HStack>
		</EditorPanelContext>
	);
};

NoteEditor.displayName = 'NoteEditor';
