/**
 * @vitest-environment jsdom
 */

import { $getRoot } from 'lexical';
import { u } from 'unist-builder';

import { convertLexicalNodeToMarkdownNode } from '../convertLexicalNodeToMarkdownNode';
import {
	$convertFromMarkdownString,
	$convertToMarkdownString,
	markdownProcessor,
} from '../markdownParser';
import { mixedList } from './markdown-samples';
import {
	createLexicalEditorInstance,
	normalizeMarkdownTree,
	updateEditorState,
} from './utils';

describe('Markdown-Lexical-Markdown round-trips must be consistent on AST level', () => {
	const cases = [
		{
			title: 'Plain list',
			markdown: '- foo\n  - bar\n  - baz',
		},
		{
			title: 'Numbered list',
			markdown: '1. foo\n  2. bar\n  3. baz',
		},
		{
			title: 'Check list with no checked items',
			markdown: '-[ ] foo\n  -[ ] bar\n  -[ ] baz',
		},
		{
			title: 'Check list with one checked item',
			markdown: '-[ ] foo\n  -[x] bar\n  -[ ] baz',
		},
		{
			title: 'Check list with all checked items',
			markdown: '-[x] foo\n  -[x] bar\n  -[x] baz',
		},
		{
			title: 'Mixed list',
			markdown: mixedList,
		},
	];

	cases.forEach(({ title, markdown: sourceText }) =>
		test(title, async () => {
			const { editor, destroy } = createLexicalEditorInstance();
			onTestFinished(destroy);

			await updateEditorState(editor, () => {
				$convertFromMarkdownString(sourceText);
			});

			expect(
				u('root', {
					children: editor.read(() =>
						$getRoot()
							.getChildren()
							.map((node) =>
								normalizeMarkdownTree(
									convertLexicalNodeToMarkdownNode(node),
								),
							),
					),
				}),
			).toMatchObject(normalizeMarkdownTree(markdownProcessor.parse(sourceText)));

			expect(editor.read(() => $convertToMarkdownString())).toMatchSnapshot();
		}),
	);
});
