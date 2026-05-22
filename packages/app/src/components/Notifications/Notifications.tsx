import React, { forwardRef } from 'react';
import { FaXmark } from 'react-icons/fa6';
import { Alert, Button, HStack, Text, useSlotRecipe, VStack } from '@chakra-ui/react';

export const Notifications = forwardRef<
	HTMLDivElement,
	{ isVisible?: boolean; onClose?: () => void; title?: string; items: string[] }
>(({ isVisible, onClose, title, items }, ref) => {
	const recipe = useSlotRecipe({ key: 'notifications' });
	const styles = recipe();

	return (
		<VStack display={isVisible ? undefined : 'none'} css={styles.root} ref={ref}>
			<HStack css={styles.head}>
				<Text>{title}</Text>
				<VStack marginStart="auto">
					<Button variant="ghost" size="sm" onClick={onClose} paddingInline={0}>
						<FaXmark />
					</Button>
				</VStack>
			</HStack>
			<VStack css={styles.body}>
				{items.map((message, idx) => (
					<Alert.Root key={idx} status="info" padding=".8rem" w="100%">
						<Alert.Indicator />
						<Text>{message}</Text>
					</Alert.Root>
				))}
			</VStack>
		</VStack>
	);
});
