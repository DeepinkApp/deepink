import { createWorkspaceSelector, selectWorkspaceRoot } from '../../utils';

import { orderBy } from './sort';

export const selectActiveTag = createWorkspaceSelector(
	[selectWorkspaceRoot],
	(workspace) => {
		if (!workspace) return null;

		const currentTag = workspace.tags.selected;
		if (!currentTag) return null;

		return workspace.tags.list.find((tag) => tag.id === currentTag) ?? null;
	},
);

export const selectTags = createWorkspaceSelector([selectWorkspaceRoot], (workspace) => {
	if (!workspace) return [];

	return workspace.tags.list;
});

export const selectWorkspaceTags = createWorkspaceSelector(
	[selectWorkspaceRoot],
	(workspace) => {
		return workspace ? workspace.tags.list : [];
	},
);

export type TagNode = {
	id: string;
	name: string;
	children: string[] | null;
};

export const selectTagsFlatTree = createWorkspaceSelector(
	[selectWorkspaceTags],
	(flatTags) => {
		const rootNodes: string[] = [];

		const tagsMap: Record<string, TagNode> = {};
		const tagToParentMap: Record<string, string> = {};

		// Fill maps
		flatTags.forEach(({ id, name, parent }) => {
			tagsMap[id] = {
				id,
				name,
				children: null,
			};

			if (parent !== null) {
				tagToParentMap[id] = parent;
			} else {
				rootNodes.push(id);
			}
		});

		// Attach tags to parents
		for (const tagId in tagToParentMap) {
			const parentId = tagToParentMap[tagId];

			const parentTag = tagsMap[parentId];

			// Create array
			if (!parentTag.children) {
				parentTag.children = [];
			}

			// Attach tag to another tag
			parentTag.children.push(tagId);
		}

		// Fill the root
		tagsMap.root = {
			id: 'ROOT',
			name: 'ROOT',
			children: rootNodes,
		};

		// Sort tags
		for (const tag of Object.values(tagsMap)) {
			if (tag.children && tag.children.length > 0) {
				tag.children.sort(orderBy((id: string) => [tagsMap[id]]));
			}
		}

		return tagsMap;
	},
);
