/* eslint-disable i18next/no-literal-string */
import React, { act, createRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createEvent } from 'effector';
import { LexicalEditor } from 'lexical';
import { LocalesProvider } from 'src/LocalesProvider';
import { Locator, page } from 'vitest/browser';
import { FilesController } from '@core/features/files/FilesController';
import { WorkspaceContext } from '@features/App/Workspace/WorkspaceContext';
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
import { WorkspaceModalProvider } from '@features/WorkspaceModal/useWorkspaceModal';
import { AppContextMenuContext } from '@hooks/useAppContextMenu';
import { createTestStore } from '@tests/utils/redux';
import { createFakeContextMenu, selectMenuByLabel } from '@utils/menu/mocks';

import { $convertToMarkdownString } from '../../plugins/Markdown/markdownParser';

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
		<WorkspaceContext
			value={{
				workspaceId: 'test-workspace-1',
				vaultId: 'test-vault-1',
			}}
		>
			<WorkspaceModalProvider>
				<NotesContext.Provider value={notesApi}>
					<FilesRegistryContext.Provider value={filesRegistry}>
						<NotesRegistryContext.Provider value={notesControl}>
							{children}
						</NotesRegistryContext.Provider>
					</FilesRegistryContext.Provider>
				</NotesContext.Provider>
			</WorkspaceModalProvider>
		</WorkspaceContext>
	);
};

export type RichEditorTestAPI = {
	root: Root;
	container: HTMLDivElement;
	destroy(): void;
	command: (format: CommandsPayload) => Promise<void>;
	getEditor(): LexicalEditor;
	getMarkdown(): string;
	getMenu(): ReturnType<typeof createFakeContextMenu>;
	openContextMenu(itemLabelsPath: string[]): Promise<void>;
	openContextMenu(locator: Locator, itemLabelsPath: string[]): Promise<void>;
	render: (props: RichEditorContentProps) => Promise<void>;
};

export const renderRichEditorInDOM = async ({
	waitForLoading = true,
	destroyHook = onTestFinished,
	...props
}: RichEditorContentProps & {
	waitForLoading?: boolean;
	destroyHook?: ((cb: () => void) => void) | null;
}): Promise<RichEditorTestAPI> => {
	const { store } = createTestStore();
	const onFormatting = createEvent<TextFormat>();
	const onInserting = createEvent<InsertingPayload>();
	const onCommand = createEvent<CommandsPayload>();

	const editorRef = createRef<LexicalEditor>();

	const fakeContextMenu = createFakeContextMenu();

	const renderEditor = (props: RichEditorContentProps) => (
		<Provider store={store}>
			<ThemeProvider>
				<LocalesProvider>
					<MockWorkspaceProvider>
						<AppContextMenuContext value={fakeContextMenu.menu}>
							<editorPanelContext.Provider
								value={{ onInserting, onFormatting, onCommand }}
							>
								<RichEditor
									placeholder="Enter text"
									syncDelay={0}
									{...props}
								/>
							</editorPanelContext.Provider>
						</AppContextMenuContext>
					</MockWorkspaceProvider>
				</LocalesProvider>
			</ThemeProvider>
		</Provider>
	);

	const container = document.createElement('div');
	document.body.appendChild(container);

	const root = createRoot(container);

	const render = (props: RichEditorContentProps) => {
		return act(() =>
			root.render(renderEditor({ ...props, editorRef })),
		) as unknown as Promise<void>;
	};

	render(props);

	const destroy = () => {
		act(() => {
			root.unmount();
		});
		container.remove();
	};

	if (waitForLoading) {
		while (true) {
			const editor = await act(() => editorRef.current);
			if (editor) break;
		}
	}

	if (destroyHook) destroyHook(destroy);

	const getActiveNodeLocator = () => {
		const candidates: Element[] = [];

		if (document.activeElement) candidates.push(document.activeElement);
		const selection = document.getSelection();
		if (selection && selection.anchorNode) {
			if (selection.anchorNode instanceof Element)
				candidates.push(selection.anchorNode);
			else if (selection.anchorNode.parentElement)
				candidates.push(selection.anchorNode.parentElement);
		}

		const element = candidates.find((element) => container.contains(element));
		if (!element) throw new Error('No active element found');

		return page.elementLocator(element);
	};

	return {
		root,
		container,

		destroy,

		command: async (format: CommandsPayload) => {
			await act(async () => onCommand(format));
		},

		getMenu() {
			return fakeContextMenu;
		},

		openContextMenu: (async (...params: [Locator, string[]] | [string[]]) => {
			const [locator, itemLabelsPath] =
				params.length === 2
					? params
					: ([getActiveNodeLocator(), params[0]] as const);

			await act(async () => {
				// TODO: emulate focus change
				fakeContextMenu.selector.mockImplementation(
					selectMenuByLabel(itemLabelsPath),
				);
				await locator.click({ button: 'right' });
			});
		}) satisfies RichEditorTestAPI['openContextMenu'],

		getEditor() {
			const editor = editorRef.current;
			if (!editor) throw new Error('Error instance is not set');
			return editor;
		},

		getMarkdown() {
			const editor = editorRef.current;
			if (!editor) throw new Error('Error instance is not set');

			return editor.read(() => $convertToMarkdownString());
		},

		render,
	};
};
