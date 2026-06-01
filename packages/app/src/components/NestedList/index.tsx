import React, { FC, ReactNode } from 'react';
import { HStack, StackProps, useSlotRecipe, VStack } from '@chakra-ui/react';

import { NestedListRecipe } from './NestedList.theme';

export type ListItem = {
	id: string;
	content: ReactNode;
	childrens?: ListItem[];
	collapsed?: boolean;
};

export type INestedListProps = StackProps & {
	items: ListItem[];
	activeItem?: string;
	onPick?: (id: string) => void;
};

export const NestedList: FC<INestedListProps> = ({
	items,
	activeItem,
	onPick,
	...props
}) => {
	const recipe = useSlotRecipe({ key: 'nestedList', recipe: NestedListRecipe });
	const styles = recipe();

	return (
		<VStack as="ul" {...props} css={styles.root}>
			{items.map((item) => {
				const itemId = item.id;
				const isGroupCollapsed = Boolean(item.collapsed);

				return (
					<VStack key={itemId} as="li" css={styles.item}>
						<HStack
							css={styles.content}
							aria-selected={activeItem === itemId}
							onClick={(evt) => {
								if (onPick) {
									evt.stopPropagation();
									onPick(itemId);
								}
							}}
						>
							{item.content}
						</HStack>

						{item.childrens && !isGroupCollapsed && (
							<VStack css={styles.group}>
								<NestedList
									items={item.childrens}
									activeItem={activeItem}
									onPick={onPick}
								/>
							</VStack>
						)}
					</VStack>
				);
			})}
		</VStack>
	);
};
