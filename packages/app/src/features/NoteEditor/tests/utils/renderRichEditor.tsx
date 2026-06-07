import React, { act } from 'react';
import { Provider } from 'react-redux';
import { createEvent } from 'effector';
import { WorkspaceProvider } from '@features/App/Workspace/WorkspaceProvider';
import {
	editorPanelContext,
	InsertingPayload,
	TextFormat,
} from '@features/NoteEditor/EditorPanel';
import { RichEditor } from '@features/NoteEditor/RichEditor/RichEditor';
import { RichEditorContentProps } from '@features/NoteEditor/RichEditor/RichEditorContent';
import { render } from '@testing-library/react';
import { createTestStore } from '@tests/utils/redux';

export const renderRichEditor = async (props: RichEditorContentProps) => {
	const { store } = createTestStore();
	const onFormatting = createEvent<TextFormat>();
	const onInserting = createEvent<InsertingPayload>();

	const renderEditor = (props: RichEditorContentProps) => (
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
					<RichEditor {...props} />
				</editorPanelContext.Provider>
			</WorkspaceProvider>
		</Provider>
	);

	// Use `act` to wait for all editor updates to complete before making assertions;
	// otherwise, some asynchronous updates may not have been applied to the DOM yet.
	const result = await act(async () => render(renderEditor(props)));

	return {
		...result,

		rerender: async (next: RichEditorContentProps) => {
			await act(async () => result.rerender(renderEditor(next)));
		},

		/**
		 * Simulates an editor panel action like inserting image
		 */
		insert: async (payload: InsertingPayload) => {
			await act(async () => onInserting(payload));
		},

		/**
		 * Simulates an editor panel formatting action like bold, italic and etc
		 */
		format: async (format: TextFormat) => {
			await act(async () => onFormatting(format));
		},
	};
};
