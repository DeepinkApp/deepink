import { useEffect } from 'react';
import { mergeRegister } from 'lexical';
import { registerCodeIndentation } from '@lexical/code-core';
import { registerCodeHighlighting } from '@lexical/code-prism';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

export const CodeHighlightPlugin = () => {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		return mergeRegister(
			registerCodeIndentation(editor),
			registerCodeHighlighting(editor),
		);
	}, [editor]);

	return null;
};
