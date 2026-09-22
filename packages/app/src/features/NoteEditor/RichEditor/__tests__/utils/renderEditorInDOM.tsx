import React, { act, createRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createEvent } from 'effector';
import { LexicalEditor } from 'lexical';
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
import { ThemeProvider } from '@features/ThemeProvider';
import { createTestStore } from '@tests/utils/redux';

// Mock useUrlOpener to avoid importing monaco-editor-core in tests,
// which causes Vite module resolution errors during test setup
vi.mock('@hooks/useUrlOpener', () => ({
	useUrlOpener: () => vi.fn(),
}));

export const MockWorkspaceProvider = ({ children }: { children: React.ReactNode }) => {
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

export type RichEditorTestAPI = {
	root: Root;
	container: HTMLDivElement;
	destroy(): void;
	insert: (payload: InsertingPayload) => Promise<void>;
	format: (format: TextFormat) => Promise<void>;
	command: (format: CommandsPayload) => Promise<void>;
	getEditor(): LexicalEditor;
};

export const renderRichEditorInDOM = async (
	props: RichEditorContentProps,
): Promise<RichEditorTestAPI> => {
	const { store } = createTestStore();
	const onFormatting = createEvent<TextFormat>();
	const onInserting = createEvent<InsertingPayload>();
	const onCommand = createEvent<CommandsPayload>();

	const editorRef = createRef<LexicalEditor>();

	const renderEditor = (props: RichEditorContentProps) => (
		<Provider store={store}>
			<ThemeProvider>
				<MockWorkspaceProvider>
					<editorPanelContext.Provider
						value={{ onInserting, onFormatting, onCommand }}
					>
						<RichEditor placeholder="Enter text" {...props} />
					</editorPanelContext.Provider>
				</MockWorkspaceProvider>
			</ThemeProvider>
		</Provider>
	);

	const container = document.createElement('div');
	document.body.appendChild(container);

	const root = createRoot(container);
	act(() => root.render(renderEditor({ ...props, editorRef })));

	return {
		root,
		container,

		destroy() {
			act(() => {
				root.unmount();
			});
			container.remove();
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

		command: async (format: CommandsPayload) => {
			await act(async () => onCommand(format));
		},

		getEditor() {
			const editor = editorRef.current;
			if (!editor) throw new Error('Error instance is not set');
			return editor;
		},
	};
};
