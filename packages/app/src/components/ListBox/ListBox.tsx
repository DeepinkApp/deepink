import React from 'react';
import {
	ListBox as BaseListBox,
	ListBoxItem as BaseListBoxItem,
	ListBoxItemProps,
	ListBoxProps,
} from 'react-aria-components/ListBox';
import { Box, BoxProps, useSlotRecipe } from '@chakra-ui/react';

import { ListBoxRecipe } from './ListBox.theme';

export const ListBoxRoot = <T extends unknown>({
	children,
	containerProps,
	...props
}: ListBoxProps<T> & { containerProps?: BoxProps }) => {
	const recipe = useSlotRecipe({ key: 'listBox', recipe: ListBoxRecipe });
	const styles = recipe();

	return (
		<Box asChild {...containerProps} css={styles.root}>
			<BaseListBox {...props}>{children}</BaseListBox>
		</Box>
	);
};

export const ListBoxItem = <T extends unknown>({
	children,
	containerProps,
	...props
}: ListBoxItemProps<T> & { containerProps?: BoxProps }) => {
	const recipe = useSlotRecipe({ key: 'listBox', recipe: ListBoxRecipe });
	const styles = recipe();

	return (
		<Box asChild {...containerProps} css={styles.item}>
			<BaseListBoxItem {...props}>{children}</BaseListBoxItem>
		</Box>
	);
};

export const ListBox = {
	Root: ListBoxRoot,
	Item: ListBoxItem,
};
