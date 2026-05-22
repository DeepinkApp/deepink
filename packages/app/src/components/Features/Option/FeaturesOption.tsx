import React, { FC, PropsWithChildren, ReactNode } from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';

export type FeaturesOptionProps = PropsWithChildren<{
	title?: string;
	description?: ReactNode;
}>;

export const FeaturesOption: FC<FeaturesOptionProps> = ({
	title,
	description,
	children,
}) => {
	return (
		<Box
			w="100%"
			css={{
				display: 'grid',
				gridTemplateColumns: '40% minmax(auto, 60%)',
				gridRowGap: '50rem',
			}}
		>
			<Text
				css={{
					display: 'flex',
					justifyContent: 'end',
					lineHeight: '120%',
					paddingTop: '.5rem',
					paddingInlineEnd: '1rem',
				}}
			>
				{title}
			</Text>
			<VStack alignItems="baseline" justifyContent="center">
				{children}
				{description && (
					<Text
						color="typography.secondary"
						fontSize=".8rem"
						whiteSpace="pre-line"
					>
						{description}
					</Text>
				)}
			</VStack>
		</Box>
	);
};
