import React, { forwardRef, memo } from 'react';
import { FaChevronDown, FaChevronUp, FaHashtag } from 'react-icons/fa6';
import { Box, HStack, StackProps, Text, useSlotRecipe } from '@chakra-ui/react';
import { getContextMenuCoords } from '@electron/requests/contextMenu/renderer';
import { useMergeRefs } from '@floating-ui/react';
import { ItemInstance } from '@headless-tree/core';
import { TagNode } from '@state/redux/vaults/vaults';

import { useTagsListContext } from './TagsTree';
import { TagsTreeRecipe } from './TagsTree.theme';

export const TagItem = memo(
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
