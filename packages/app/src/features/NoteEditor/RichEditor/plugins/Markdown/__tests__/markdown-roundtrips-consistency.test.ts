/**
 * @vitest-environment jsdom
 */

import {
	$convertFromMarkdownString,
	$convertToMarkdownString,
	$serializeAsMarkdownAST,
	parseMarkdownToAST,
} from '../markdownParser';
import {
	formattedLine,
	mixedList,
	postWithHeaders,
	simpleCode,
} from './markdown-samples';
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
		{
			title: 'Simple post with headers',
			markdown: postWithHeaders,
		},
		{
			title: 'Text with few empty lines',
			markdown: 'foo\n\n\nbar',
		},
		{
			title: 'Simple code',
			markdown: simpleCode,
		},
		{
			title: 'Formatted line',
			markdown: formattedLine,
		},
		{
			title: 'Links',
			markdown: `Some [link](https://url "Title") and [another link](proto://url)`,
		},
		{
			title: 'Image',
			// TODO: support for title
			markdown: `![Alt text](https://url)`,
		},
		{
			title: 'Image wrapped by link',
			// TODO: support for title
			markdown: `[![Alt text](https://url)](proto://url2 "Link title")`,
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
				editor.read(() => normalizeMarkdownTree($serializeAsMarkdownAST())),
			).toMatchObject(normalizeMarkdownTree(parseMarkdownToAST(sourceText)));

			expect(editor.read(() => $convertToMarkdownString())).toMatchSnapshot();
		}),
	);
});
