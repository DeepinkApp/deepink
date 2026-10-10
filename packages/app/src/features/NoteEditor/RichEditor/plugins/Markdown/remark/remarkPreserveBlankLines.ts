import { type List, type ListItem, type Root, RootContent } from 'mdast';
import { Plugin } from 'unified';
import { CONTINUE, SKIP, visit } from 'unist-util-visit';

const ignoredNodeTypes = new Set<string>([
	'table',
	'tableCell',
	'tableRow',
] satisfies RootContent['type'][]);

const isTaskListItem = (item: ListItem) =>
	item.checked !== null && item.checked !== undefined;

// Lexical represents task lists and regular lists as different list types, but
// mdast can keep both kinds of item in one list when there is a blank line.
const splitListAtTaskBoundary = (list: List): List[] => {
	const groups: { items: ListItem[]; startIndex: number }[] = [];
	let items: ListItem[] = [];
	let startIndex = 0;

	for (let i = 0; i < list.children.length; i++) {
		const item = list.children[i];
		const previousItem = items.at(-1);
		const hasBlankLineBefore =
			previousItem?.position &&
			item.position &&
			item.position.start.line > previousItem.position.end.line + 1;
		const changesTaskStatus =
			previousItem && isTaskListItem(previousItem) !== isTaskListItem(item);

		if (hasBlankLineBefore && changesTaskStatus) {
			groups.push({ items, startIndex });
			items = [];
			startIndex = i;
		}

		items.push(item);
	}

	if (items.length > 0) groups.push({ items, startIndex });
	if (groups.length <= 1) return [list];

	return groups.map(({ items: groupItems, startIndex: groupStartIndex }) => {
		const firstItem = groupItems[0];
		const lastItem = groupItems[groupItems.length - 1];
		const position =
			list.position && firstItem.position && lastItem.position
				? { start: firstItem.position.start, end: lastItem.position.end }
				: list.position;

		return {
			...list,
			...(list.ordered ? { start: (list.start ?? 1) + groupStartIndex } : {}),
			children: groupItems,
			position,
		};
	});
};

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
			newChildren.push(
				...(current.type === 'list'
					? splitListAtTaskBoundary(current)
					: [current]),
			);

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
