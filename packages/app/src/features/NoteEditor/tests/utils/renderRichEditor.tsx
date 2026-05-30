import React from 'react';
import { Provider } from 'react-redux';
import { createEvent } from 'effector';
import { WorkspaceProvider } from '@features/App/Workspace/WorkspaceProvider';
import {
	editorPanelContext,
	InsertingPayload,
	TextFormat,
} from '@features/NoteEditor/EditorPanel';
import { RichEditor } from '@features/NoteEditor/RichEditor/RichEditor';
import { act, render } from '@testing-library/react';
import { createTestStore } from '@tests/utils/redux';

type RichEditorProps = {
	value: string;
	onChanged?: (value: string) => void;
	placeholder?: string;
	isReadOnly?: boolean;
};

type RenderRichEditorResult = {
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

export async function renderRichEditor(
	props: RichEditorProps,
): Promise<RenderRichEditorResult> {
	const { store } = createTestStore();

	const onFormatting = createEvent<TextFormat>();
	const onInserting = createEvent<InsertingPayload>();

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
					<RichEditor
						value={props.value}
						onChanged={props.onChanged}
						placeholder={props.placeholder}
						isReadOnly={props.isReadOnly}
					/>
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

	return {
		insert: (payload: InsertingPayload) => onInserting(payload),
		format: (format: TextFormat) => onFormatting(format),

		rerender: async (props: RichEditorProps) => {
			await act(async () => renderResult(getJSX(props)));
		},
	};
}
