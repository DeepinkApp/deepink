import { type Root, RootContent } from 'mdast';
import { Plugin } from 'unified';
import { CONTINUE, SKIP, visit } from 'unist-util-visit';

const ignoredNodeTypes = new Set<string>([
	'table',
	'tableCell',
	'tableRow',
] satisfies RootContent['type'][]);

export const fillGapsWithParagraphs = (tree: Root) => {
	const skipNodes = new Set<unknown>();

	visit(tree, (node) => {
		// Skip nodes with no nested elements
		if (!('children' in node)) return SKIP;

		// Skip ignored node types
		if (ignoredNodeTypes.has(node.type)) return SKIP;

		// Skip already handled nodes
		if (skipNodes.has(node)) return SKIP;

		const newChildren: RootContent[] = [];
		for (let i = 0; i < node.children.length; i++) {
			const current = node.children[i];
			const next = node.children[i + 1];

			// Collect its own children
			newChildren.push(current);

			// Add empty lines to preserve
			if (next && current.position && next.position) {
				const lineGap = next.position.start.line - current.position.end.line;
				// lineGap === 2 means exactly one blank line, 3 means two, etc.
				const blankLineCount = lineGap - 1;
				// 1 or 2 blank lines means just a gap between paragraphs
				// More than 2 blank lines means there are `n-2` paragraphs joined with no empty lines,
				// and 1 line gap from each side
				const paragraphsCount = Math.max(0, blankLineCount - 2);

				for (let b = 0; b < paragraphsCount; b++) {
					const line = current.position.end.line + 1 + b;
					const emptyLine = {
						type: 'paragraph',
						children: [],
						// TODO: add tests to verify position are correct in complex cases
						position: {
							start: { line, column: 1, offset: 0 },
							end: { line, column: 1, offset: 0 },
						},
					} as RootContent;

					newChildren.push(emptyLine);
					skipNodes.add(emptyLine);
				}
			}
		}

		node.children = newChildren;

		return CONTINUE;
	});

	return tree;
};

export const remarkPreserveBlankLines: Plugin<[], Root> = () => {
	return fillGapsWithParagraphs;
};
