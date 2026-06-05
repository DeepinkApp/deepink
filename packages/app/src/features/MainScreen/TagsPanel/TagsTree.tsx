import React, { createContext, FC, useEffect, useMemo, useRef } from 'react';
import {
	buildProxiedInstance,
	FeatureImplementation,
	hotkeysCoreFeature,
	selectionFeature,
	syncDataLoaderFeature,
} from '@headless-tree/core';
import { useTree } from '@headless-tree/react';
import { orderBy } from '@state/redux/vaults/selectors/tags/sort';
import { TagNode } from '@state/redux/vaults/vaults';
import { Virtualizer } from '@tanstack/react-virtual';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { TagContextMenuCallbacks, useTagContextMenu } from './useTagContextMenu';
import { VirtualTagsList } from './VirtualTagsList';

const TagsListContext = createContext<{
	showTagMenu: (
		id: string,
		point: {
			x: number;
			y: number;
		},
	) => void;
} | null>(null);

export const useTagsListContext = createContextGetterHook(TagsListContext);

const customClickBehavior: FeatureImplementation = {
	itemInstance: {
		getProps: ({ tree, item, prev }) => ({
			...prev?.(),
			onDoubleClick: () => {
				item.primaryAction();

				// Toggle folder expanding
				if (!item.isFolder()) {
					return;
				}

				if (item.isExpanded()) {
					item.collapse();
				} else {
					item.expand();
				}
			},
			onClick: (e: MouseEvent) => {
				if (e.ctrlKey || e.metaKey) {
					item.toggleSelect();
				} else {
					tree.setSelectedItems([item.getItemMeta().itemId]);
				}

				item.setFocused();
			},
		}),
	},
};

export type ITagsListProps = {
	tags: Record<string, TagNode>;
	activeTag?: string;
	onTagClick?: (id: string | null) => void;
	contextMenu: TagContextMenuCallbacks;
};

export const TagsTree: FC<ITagsListProps> = ({
	tags,
	activeTag,
	contextMenu,
	onTagClick,
}) => {
	const onTagMenu = useTagContextMenu(contextMenu);
	const context = useMemo(
		() => ({
			showTagMenu: onTagMenu,
		}),
		[onTagMenu],
	);

	// TODO: scroll to active tag
	const virtualizer = useRef<Virtualizer<HTMLDivElement, Element> | null>(null);
	const tree = useTree<TagNode>({
		initialState: { expandedItems: Object.keys(tags) },
		state: { selectedItems: activeTag ? [activeTag] : [] },
		setSelectedItems: (updater) => {
			if (!onTagClick) return;

			const items = typeof updater === 'function' ? updater([]) : updater;

			if (items.length > 1) {
				console.warn(
					'Selected more than one tags. It is not supported yet, so the first tag only will be selected',
				);
			}

			onTagClick(items.length > 0 ? items[0] : null);
		},
		rootItemId: 'root',
		getItemName: (item) => item.getItemData().name,
		isItemFolder: (item) => (item.getItemData().children?.length ?? 0) > 0,
		scrollToItem: (item) => {
			virtualizer.current?.scrollToIndex(item.getItemMeta().index);
		},
		instanceBuilder: buildProxiedInstance,
		dataLoader: {
			getItem: (itemId) => tags[itemId],
			getChildren: (itemId) =>
				(tags[itemId].children ?? []).sort(
					orderBy((tagId) => {
						const { id, name } = tags[tagId];
						return [name, id];
					}),
				),
		},
		canReorder: true,
		indent: 20,
		features: [
			syncDataLoaderFeature,
			selectionFeature,
			hotkeysCoreFeature,
			customClickBehavior,
		],
	});

	// Rebuild tree by changes
	useEffect(() => {
		tree.rebuildTree();
	}, [tags, tree]);

	return (
		<TagsListContext value={context}>
			<VirtualTagsList tree={tree} ref={virtualizer} />
		</TagsListContext>
	);
};
