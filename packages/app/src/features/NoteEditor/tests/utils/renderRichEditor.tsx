import React, { act } from 'react';
import { Provider } from 'react-redux';
import { createEvent } from 'effector';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
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
			<ChakraProvider value={defaultSystem}>
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
			</ChakraProvider>
		</Provider>
	);

	const result = render(renderEditor(props));

	return {
		...result,

		rerender: async (next: RichEditorContentProps) => {
			await act(async () => result.rerender(renderEditor(next)));
		},

		/**
		 * Simulates an editor panel action like inserting image
		 */
		insert: async (payload: InsertingPayload) => {
			// The Rich Editor can update the DOM asynchronously,
			// the act must be awaited to ensure all pending updates are finished before making assertions
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
