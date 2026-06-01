import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Box, useSlotRecipe } from '@chakra-ui/react';
import { ItemInstance, TreeInstance } from '@headless-tree/core';
import { TagNode } from '@state/redux/vaults/vaults';
import { useVirtualizer, Virtualizer } from '@tanstack/react-virtual';

import { TagItem } from './TagItem';
import { TagsTreeRecipe } from './TagsTree.theme';
import { useHandlerFactory } from './useHandlerFactory';

export const VirtualTagsList = forwardRef<
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
