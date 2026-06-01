import React, {
	createContext,
	FC,
	forwardRef,
	memo,
	useImperativeHandle,
	useMemo,
	useRef,
} from 'react';
import { FaChevronDown, FaChevronUp, FaHashtag } from 'react-icons/fa6';
import { Box, HStack, StackProps, Text, useSlotRecipe } from '@chakra-ui/react';
import { getContextMenuCoords } from '@electron/requests/contextMenu/renderer';
import { useMergeRefs } from '@floating-ui/react';
import {
	FeatureImplementation,
	hotkeysCoreFeature,
	ItemInstance,
	selectionFeature,
	syncDataLoaderFeature,
	TreeInstance,
} from '@headless-tree/core';
import { useTree } from '@headless-tree/react';
import { TagNode } from '@state/redux/vaults/vaults';
import { useVirtualizer, Virtualizer } from '@tanstack/react-virtual';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { TagsTreeRecipe } from './TagsTree.theme';
import { useHandlerFactory } from './useHandlerFactory';
import { TagContextMenuCallbacks, useTagContextMenu } from './useTagContextMenu';

const TagsListContext = createContext<{
	showTagMenu: (
		id: string,
		point: {
			x: number;
			y: number;
		},
	) => void;
} | null>(null);

const useTagsListContext = createContextGetterHook(TagsListContext);

const TagItem = memo(
	forwardRef<
		HTMLDivElement,
		{
			item: ItemInstance<TagNode>;
			level: number;
			isSelected?: boolean;
			name: string;
			isExpanded?: boolean;
			toggleExpanded?: () => void;
		} & StackProps
	>(({ item, name, level, isSelected, isExpanded, toggleExpanded, ...props }, ref) => {
		const { showTagMenu } = useTagsListContext();

		const recipe = useSlotRecipe({ key: 'tagsTree', recipe: TagsTreeRecipe });
		const styles = recipe();

		const composedRef = useMergeRefs([ref, item.getProps().ref]);

		/* This node instance can do many things. See the API reference. */
		return (
			<Box
				css={styles.item}
				style={{ paddingLeft: `${level * 20}px` }}
				onContextMenu={(evt) => {
					evt.preventDefault();
					showTagMenu(item.getId(), getContextMenuCoords(evt.nativeEvent));
				}}
				{...item.getProps()}
				{...props}
				ref={composedRef}
			>
				<HStack css={styles.content}>
					<FaHashtag size="1rem" />

					<Text overflow="hidden" textOverflow="ellipsis">
						{name}
					</Text>
				</HStack>

				{toggleExpanded && (
					<Box
						as="button"
						tabIndex={-1}
						css={styles.expandButton}
						onClick={toggleExpanded}
					>
						{isExpanded ? <FaChevronUp /> : <FaChevronDown />}
					</Box>
				)}
			</Box>
		);
	}),
);

TagItem.displayName = 'TagItem';

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

const VirtualTagsList = forwardRef<
	Virtualizer<HTMLDivElement, Element>,
	{ tree: TreeInstance<TagNode> }
>(({ tree }, ref) => {
	const recipe = useSlotRecipe({ key: 'tagsTree', recipe: TagsTreeRecipe });
	const styles = recipe();

	const parentRef = useRef<HTMLDivElement | null>(null);

	// eslint-disable-next-line react-hooks/incompatible-library
	const virtualizer = useVirtualizer({
		count: tree.getItems().length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 38,
		useFlushSync: false,
		overscan: 10,
	});

	useImperativeHandle(ref, () => virtualizer);

	const getExpanded = useHandlerFactory<ItemInstance<TagNode>>((item) => {
		if (item.isExpanded()) item.collapse();
		else item.expand();
	});

	return (
		<Box ref={parentRef} css={styles.root}>
			<Box
				{...tree.getContainerProps()}
				style={{
					position: 'relative',
					width: '100%',
					height: `${virtualizer.getTotalSize()}px`,
					flexShrink: 0,
					alignContent: 'start',
				}}
			>
				<Box
					css={styles.container}
					style={{
						width: '100%',
						marginTop: `${virtualizer.getVirtualItems()[0]?.start ?? 0}px`,
						top: 0,
						left: 0,
					}}
				>
					{virtualizer.getVirtualItems().map((virtualItem) => {
						const item = tree.getItems()[virtualItem.index];

						return (
							<TagItem
								ref={virtualizer.measureElement}
								data-index={virtualItem.index}
								key={item.getId()}
								level={item.getItemMeta().level}
								isSelected={item.isSelected()}
								name={item.getItemName()}
								toggleExpanded={
									item.isFolder() ? getExpanded(item) : undefined
								}
								isExpanded={item.isExpanded()}
								item={item}
							/>
						);
					})}
				</Box>
			</Box>
		</Box>
	);
});

export type ITagsListProps = {
	tags: Record<string, TagNode>;
	activeTag?: string;
	onTagClick?: (id: string) => void;
	contextMenu: TagContextMenuCallbacks;
};

export const TagsList: FC<ITagsListProps> = ({
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
			const items = typeof updater === 'function' ? updater([]) : updater;

			if (items.length > 1) {
				console.warn(
					'Selected more than one tags. It is not supported yet, so the first tag only will be selected',
				);
			}

			onTagClick?.(items[0]);
		},
		rootItemId: 'root',
		getItemName: (item) => item.getItemData().name,
		isItemFolder: (item) => (item.getItemData().children?.length ?? 0) > 0,
		scrollToItem: (item) => {
			virtualizer.current?.scrollToIndex(item.getItemMeta().index);
		},
		dataLoader: {
			getItem: (itemId) => tags[itemId],
			getChildren: (itemId) => tags[itemId].children ?? [],
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

	return (
		<TagsListContext value={context}>
			<VirtualTagsList tree={tree} ref={virtualizer} />
		</TagsListContext>
	);
};
