/* eslint-disable i18next/no-literal-string */
import React, { act, createRef } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { Provider } from 'react-redux';
import { createEvent } from 'effector';
import i18n from 'i18next';
import { LexicalEditor } from 'lexical';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { FilesController } from '@core/features/files/FilesController';
import {
	FilesRegistryContext,
	NotesContext,
	NotesRegistryContext,
} from '@features/App/Workspace/WorkspaceProvider';
import {
	CommandsPayload,
	editorPanelContext,
	InsertingPayload,
	TextFormat,
} from '@features/NoteEditor/EditorPanel';
import { RichEditor } from '@features/NoteEditor/RichEditor/RichEditor';
import { RichEditorContentProps } from '@features/NoteEditor/RichEditor/RichEditorContent';
import { render } from '@testing-library/react';
import { createTestStore } from '@tests/utils/redux';

// Mock useUrlOpener to avoid importing monaco-editor-core in tests,
// which causes Vite module resolution errors during test setup
vi.mock('@hooks/useUrlOpener', () => ({
	useUrlOpener: () => vi.fn(),
}));

// JSdom does not perform real image loading, so the Image `onload` event is never triggered
// Mock it to allow components that depend on image loading (such as ImageNode) to render correctly
class MockImage {
	onload = () => {};

	set src(_: string) {
		queueMicrotask(() => this.onload());
	}
}
global.Image = MockImage as any;

const MockWorkspaceProvider = ({ children }: { children: React.ReactNode }) => {
	const filesRegistry = {
		add: vi.fn(),
		get: vi.fn(),
		delete: vi.fn(),
		query: vi.fn(),
	} as unknown as FilesController;

	const notesControl = {
		get: vi.fn(),
		updateBatch: vi.fn(),
		getById: vi.fn(),
		getLength: vi.fn(),
		query: vi.fn(),
		add: vi.fn(),
		update: vi.fn(),
		updateMeta: vi.fn(),
		delete: vi.fn(),
	};

	const notesApi = {
		openNote: vi.fn(),
		noteUpdated: vi.fn(),
		noteClosed: vi.fn(),
	};

	return (
		<NotesContext.Provider value={notesApi}>
			<FilesRegistryContext.Provider value={filesRegistry}>
				<NotesRegistryContext.Provider value={notesControl}>
					{children}
				</NotesRegistryContext.Provider>
			</FilesRegistryContext.Provider>
		</NotesContext.Provider>
	);
};

export const renderRichEditor = async (props: RichEditorContentProps) => {
	const { store } = createTestStore();
	const onFormatting = createEvent<TextFormat>();
	const onInserting = createEvent<InsertingPayload>();
	const onCommand = createEvent<CommandsPayload>();

	const editorRef = createRef<LexicalEditor>();

	i18n.use(initReactI18next) // passes i18n down to react-i18next
		.init({
			lng: 'en',
			fallbackLng: 'en',

			ns: [],

			interpolation: {
				escapeValue: false,
			},

			react: {
				useSuspense: false, // important since we manually wait
			},
		});

	const renderEditor = (props: RichEditorContentProps) => (
		<Provider store={store}>
			<ChakraProvider value={defaultSystem}>
				<I18nextProvider i18n={i18n}>
					<MockWorkspaceProvider>
						<editorPanelContext.Provider
							value={{ onInserting, onFormatting, onCommand }}
						>
							<RichEditor placeholder="Enter text" {...props} />
						</editorPanelContext.Provider>
					</MockWorkspaceProvider>
				</I18nextProvider>
			</ChakraProvider>
		</Provider>
	);

	const result = render(renderEditor({ ...props, editorRef }));

	return {
		...result,

		rerender: async (next: RichEditorContentProps) => {
			await act(async () => result.rerender(renderEditor(next)));
		},

		/**
		 * Simulates an editor panel action like inserting image
		 */
		insert: async (payload: InsertingPayload) => {
			// Wrap editor actions in act() so React flushes all state updates
			// before assertions are executed
			await act(async () => onInserting(payload));
		},

		/**
		 * Simulates an editor panel formatting action like bold, italic and etc
		 */
		format: async (format: TextFormat) => {
			await act(async () => onFormatting(format));
		},

		getEditor() {
			return editorRef.current;
		},
	};
};
