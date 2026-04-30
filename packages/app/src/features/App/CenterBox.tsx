import React, { FC, PropsWithChildren } from 'react';
import { Box, Center } from '@chakra-ui/react';

export const CenterBox: FC<PropsWithChildren<{ maxWidth?: string }>> = ({
	maxWidth,
	children,
}) => {
	return (
		<Center width="100%" h="100vh" alignItems="start" overflow="auto" padding="3rem">
			<Box maxW={maxWidth ?? '500px'} minW="450px" margin="auto">
				{children}
			</Box>
		</Center>
	);
};
