import React from 'react';
import { StackProps, VStack } from '@chakra-ui/react';
import { FeaturesHeader } from '@components/Features/Header/FeaturesHeader';

export const FeaturesPanel = ({ children, ...props }: StackProps) => {
	return (
		<VStack
			align="start"
			backgroundColor="surface.panel"
			padding="1rem"
			borderRadius="xl"
			width="100%"
			gap="1rem"
			{...props}
		>
			{children}
		</VStack>
	);
};

export const FeaturesGroup = ({
	title,
	children,
	...props
}: StackProps & { title?: string }) => {
	return (
		<VStack align="start" width="100%" {...props}>
			{title && <FeaturesHeader>{title}</FeaturesHeader>}
			<FeaturesPanel>{children}</FeaturesPanel>
		</VStack>
	);
};
