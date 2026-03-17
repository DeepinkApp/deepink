/* eslint-disable @cspell/spellchecker */
import React, {
	HTMLAttributes,
	Ref,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';
import { colord, extend } from 'colord';
import mixPlugin from 'colord/plugins/mix';
import { editor, languages } from 'monaco-editor-core';
import { getBrightness, setBrightness } from '@components/theme/color';
import { useImmutableCallback } from '@hooks/useImmutableCallback';
import { useAppSelector } from '@state/redux/hooks';
import {
	selectEditorConfig,
	selectEditorFontFamily,
} from '@state/redux/settings/selectors/preferences';
import { setRef } from '@utils/react/setRef';

import { defaultExtensions } from './extensions';
import { FileUploader, useDropFiles } from './features/useDropFiles';
import * as markdown from './languages/markdown';
import * as typescript from './languages/typescript';

// Configure monako
languages.register({
	id: 'javascript',
	extensions: ['.js', '.es6', '.jsx', '.mjs', '.cjs'],
	firstLine: '^#!.*\\bnode',
	filenames: ['jakefile'],
	aliases: ['JavaScript', 'javascript', 'js'],
	mimetypes: ['text/javascript'],
});

languages.setMonarchTokensProvider('javascript', typescript.language);
languages.setLanguageConfiguration('javascript', typescript.conf);

languages.register({
	id: 'markdown',
	extensions: [
		'.md',
		'.markdown',
		'.mdown',
		'.mkdn',
		'.mkd',
		'.mdwn',
		'.mdtxt',
		'.mdtext',
	],
	aliases: ['Markdown', 'markdown'],
});

languages.setMonarchTokensProvider('markdown', markdown.language);
languages.setLanguageConfiguration('markdown', markdown.conf);

export function updateMonacoTheme() {
	extend([mixPlugin]);

	const styles = getComputedStyle(document.documentElement);
	const getColor = (name: string) => {
		const color = styles.getPropertyValue(name).trim();
		if (color.length === 0) {
			throw new Error(`Cannot resolve a color in property ${name}`);
		}

		return colord(color).toHex();
	};

	const getColorWithFallback = <T extends unknown>(name: string, fallback: T) => {
		try {
			return getColor(name);
		} catch (error) {
			console.warn("Can't resolve a color in CSS property", name);
			console.error(error);
			return fallback;
		}
	};

	const colors = {
		accent: getColor('--chakra-colors-accent-300'),
		background: getColor('--chakra-colors-surface-background'),
		text: getColor('--chakra-colors-typography-base'),
		secondary: getColor('--chakra-colors-typography-secondary'),
		selection: getColor('--chakra-colors-selection-background'),
		highlight: getColor('--chakra-colors-highlight-background'),
	};

	// We set custom styles for selection to ensure enough contrast between foreground and background
	// This is necessary since option `editor.selectionForeground` does not work in Monaco editor
	// See a bug report https://github.com/microsoft/monaco-editor/issues/5192
	// TODO: customize foreground style with option `editor.selectionForeground` once bug will be fixed
	const selectionColor = setBrightness(
		colors.selection,
		getBrightness(colors.text) > 0.5 ? 0.5 : 0.9,
	);

	// Build rules
	const rulesMap = {
		keyword: '--chakra-colors-code-token-function',
		comment: '--chakra-colors-code-token-comment',
		variable: '--chakra-colors-code-token-selector',
		number: '--chakra-colors-code-token-selector',
		regexp: '--chakra-colors-code-token-selector',
		string: '--chakra-colors-code-token-selector',
	};

	const rules: editor.ITokenThemeRule[] = [];
	for (const [token, cssProp] of Object.entries(rulesMap)) {
		const color = getColorWithFallback(cssProp, null);
		if (!color) continue;

		rules.push({ token, foreground: color });
	}

	editor.defineTheme('native', {
		base: 'vs',
		inherit: false,
		rules: rules,
		colors: {
			'editor.background': colors.background,
			'editor.foreground': colors.text,
			'editorCursor.foreground': colors.text,
			'editorLineNumber.foreground': colors.secondary,
			'editor.lineHighlightBackground': colord(colors.selection).alpha(0.2).toHex(),
			'editor.selectionBackground': selectionColor,
			'editor.selectionHighlightBackground': selectionColor,
			'editor.inactiveSelectionBackground': selectionColor,
		},
	});
}

export type MonacoAPI = {
	focus(): void;
};

export type MonacoEditorProps = HTMLAttributes<HTMLDivElement> & {
	value: string;
	setValue?: (value: string) => void;
	apiRef?: Ref<MonacoAPI>;
	uploadFile: FileUploader;
	isReadOnly?: boolean;
};

/**
 * Rich editor from VSCode
 * See docs: https://microsoft.github.io/monaco-editor/docs.html
 */
export const MonacoEditor = ({
	value,
	setValue,
	apiRef,
	uploadFile,
	isReadOnly,
	...props
}: MonacoEditorProps) => {
	const editorConfig = useAppSelector(selectEditorConfig);
	const fontFamily = useAppSelector(selectEditorFontFamily);

	const setValueRef = useRef(setValue);
	setValueRef.current = setValue;

	// Init
	const editorContainerRef = useRef<HTMLDivElement>(null);
	const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
	const [editorObject, setEditorObject] = useState<editor.IStandaloneCodeEditor | null>(
		null,
	);

	const updateDimensions = useCallback(() => {
		const editorContainer = editorContainerRef.current;
		const monacoEditor = editorRef.current;
		if (!editorContainer || !monacoEditor) return;

		monacoEditor.layout({ width: 0, height: 0 });

		requestAnimationFrame(() => {
			const containerRect = editorContainer.getClientRects()[0];
			if (!containerRect) return;

			const { width, height } = containerRect;
			monacoEditor.layout({ width, height });
		});
	}, []);

	useEffect(() => {
		const editorContainer = editorContainerRef.current;
		if (!editorContainer) return;

		const monacoEditor = editor.create(editorContainer, {
			readOnly: isReadOnly,
			value,
			theme: 'native',
			language: 'markdown',
			fontFamily: fontFamily,
			fontSize: editorConfig.fontSize,
			lineHeight: editorConfig.lineHeight,
			minimap: { enabled: editorConfig.miniMap },
			lineNumbers: editorConfig.lineNumbers ? 'on' : 'off',
			// @ts-expect-error Disable hardcoded brackets colorization: https://github.com/microsoft/monaco-editor/issues/4535#issuecomment-2234042290
			'bracketPairColorization.enabled': false,
			automaticLayout: true,
			wordWrap: 'on',
			quickSuggestions: false,
			unicodeHighlight: {
				ambiguousCharacters: false,
				invisibleCharacters: true,
			},
			folding: false,
		});

		editorRef.current = monacoEditor;

		// Update value
		monacoEditor.onDidChangeModelContent((evt) => {
			if (evt.changes.length === 0) return;
			if (setValueRef.current) {
				setValueRef.current(monacoEditor.getValue());
			}
		});

		// Ignore keys while focus on editor
		const onKeyPress = (evt: KeyboardEvent) => {
			if (monacoEditor.hasWidgetFocus()) {
				evt.stopPropagation();
			}
		};

		editorContainer.addEventListener('keydown', onKeyPress);
		editorContainer.addEventListener('keyup', onKeyPress);

		// Handle window resize
		window.addEventListener('resize', updateDimensions);

		// Enable extensions
		const extensionsCleanupCallbacks = defaultExtensions.map((extension) =>
			extension(monacoEditor),
		);

		setEditorObject(monacoEditor);

		return () => {
			editorContainer.removeEventListener('keydown', onKeyPress);
			editorContainer.removeEventListener('keyup', onKeyPress);
			window.removeEventListener('resize', updateDimensions);

			extensionsCleanupCallbacks.forEach((callback) => {
				if (callback) {
					callback();
				}
			});

			monacoEditor.dispose();

			setEditorObject(null);
		};

		// Hook runs only once to initialize component
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Control over readonly mode
	useEffect(() => {
		if (editorRef.current) {
			editorRef.current.updateOptions({ readOnly: isReadOnly });
		}
	}, [isReadOnly]);

	// Update value
	useEffect(() => {
		const editor = editorRef.current;
		if (!editor) return;

		if (editor.getValue() !== value) {
			// Save the cursor position before calling setValue, because it resets the cursor to 0:0
			const position = editor.getPosition();
			editor.setValue(value);

			if (position) {
				const model = editor.getModel();
				if (!model) return;

				// Keep the cursor within valid bounds in case the new value is shorter than the previous one
				const line = Math.min(position.lineNumber, model.getLineCount());
				const column = Math.min(position.column, model.getLineMaxColumn(line));

				editor.setPosition({ lineNumber: line, column });
			}
		}
	});

	// Update config
	useEffect(() => {
		const editor = editorRef.current;
		if (!editor) return;

		editor.updateOptions({
			fontFamily: editorConfig.fontFamily,
			fontSize: editorConfig.fontSize,
			lineHeight: editorConfig.lineHeight,
			minimap: { enabled: editorConfig.miniMap },
			lineNumbers: editorConfig.lineNumbers ? 'on' : 'off',
		});
	}, [
		editorConfig.fontFamily,
		editorConfig.fontSize,
		editorConfig.lineHeight,
		editorConfig.lineNumbers,
		editorConfig.miniMap,
	]);

	// Handle drop file
	useDropFiles({ editor: editorObject, uploadFile });

	// Expose API
	const focusEditor = useImmutableCallback(async () => {
		const startTime = Date.now();

		// Wait some time for editor ref in case the method is called too early
		while (true) {
			const editor = editorRef.current;
			if (editor) {
				editor.focus();
				break;
			}

			if (Date.now() - startTime >= 300) break;

			await new Promise((res) => requestAnimationFrame(res));
		}
	}, []);

	useEffect(() => {
		return setRef(apiRef ?? null, {
			focus() {
				focusEditor();
			},
		} satisfies MonacoAPI);
	}, [apiRef, focusEditor]);

	return <div ref={editorContainerRef} {...props}></div>;
};
