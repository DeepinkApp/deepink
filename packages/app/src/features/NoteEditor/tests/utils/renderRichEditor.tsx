import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { createEvent } from 'effector';
import { LexicalEditor } from 'lexical';
import { WorkspaceProvider } from '@features/App/Workspace/WorkspaceProvider';
import {
	editorPanelContext,
	InsertingPayload,
	TextFormat,
} from '@features/NoteEditor/EditorPanel';
import { ImageNode } from '@features/NoteEditor/RichEditor/plugins/Image/ImageNode';
import { FormattingNode } from '@features/NoteEditor/RichEditor/plugins/Markdown/nodes/FormattingNode';
import { RawNode } from '@features/NoteEditor/RichEditor/plugins/Markdown/nodes/RawNode';
import { RichEditorContent } from '@features/NoteEditor/RichEditor/RichEditorContent';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { MarkNode } from '@lexical/mark';
import { OverflowNode } from '@lexical/overflow';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { act, render } from '@testing-library/react';
import { createTestStore } from '@tests/utils/redux';

const RICH_EDITOR_NODES = [
	RawNode,
	FormattingNode,
	ImageNode,
	LinkNode,
	AutoLinkNode,
	ListNode,
	ListItemNode,
	TableNode,
	TableCellNode,
	TableRowNode,
	HorizontalRuleNode,
	HeadingNode,
	QuoteNode,
	CodeNode,
	CodeHighlightNode,
	MarkNode,
	OverflowNode,
];

type RichEditorProps = {
	value: string;
	onChanged?: (value: string) => void;
	placeholder?: string;
	isReadOnly?: boolean;
};

type RenderRichEditorResult = {
	editor: LexicalEditor;

	/**
	 * Simulates an editor panel action like inserting image
	 */
	insert: (payload: InsertingPayload) => void;

	/**
	 * Simulates an editor panel formatting action like bold, italic and etc
	 */
	format: (format: TextFormat) => void;

	/**
	 * Re-renders the editor with new props
	 */
	rerender: (props: RichEditorProps) => void;
};

function EditorCapturePlugin({ onReady }: { onReady: (editor: LexicalEditor) => void }) {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		onReady(editor);
	}, [editor, onReady]);

	return null;
}

export async function renderRichEditor(
	props: RichEditorProps,
): Promise<RenderRichEditorResult> {
	const { store } = createTestStore();

	const onFormatting = createEvent<TextFormat>();
	const onInserting = createEvent<InsertingPayload>();

	let editor: LexicalEditor | null = null;

	const getJSX = (props: RichEditorProps) => (
		<Provider store={store}>
			<WorkspaceProvider
				notesApi={{} as any}
				filesRegistry={{} as any}
				filesController={{} as any}
				attachmentsController={{} as any}
				tagsRegistry={{} as any}
				notesRegistry={{} as any}
				notesHistory={{} as any}
				notesIndex={{} as any}
			>
				<editorPanelContext.Provider value={{ onInserting, onFormatting }}>
					<LexicalComposer
						initialConfig={{
							namespace: 'RichEditor',
							nodes: [...RICH_EDITOR_NODES],
							onError: console.error,
						}}
					>
						<RichEditorContent
							value={props.value}
							onChanged={props.onChanged}
							placeholder={props.placeholder}
							isReadOnly={props.isReadOnly}
						/>

						{/* Use this plugin to get the editor instance for testing */}
						<EditorCapturePlugin onReady={(e) => (editor = e)} />
					</LexicalComposer>
				</editorPanelContext.Provider>
			</WorkspaceProvider>
		</Provider>
	);

	let renderResult: (ui: React.ReactElement) => void;

	// Use `act` to make sure all updates have been applied to the DOM before making any assertions
	await act(async () => {
		const result = render(getJSX({ ...props }));
		renderResult = result.rerender;
	});

	if (!editor) throw new Error('Rich Editor not founded');

	return {
		editor,
		insert: (payload: InsertingPayload) => onInserting(payload),
		format: (format: TextFormat) => onFormatting(format),

		rerender: async (props: RichEditorProps) => {
			await act(async () => renderResult(getJSX(props)));
		},
	};
}
