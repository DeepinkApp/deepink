import React from 'react';
import { Box, Spinner, VStack } from '@chakra-ui/react';

export const SplashScreen = () => {
	return (
		<Box
			position="fixed"
			top={0}
			left={0}
			height="100vh"
			width="100%"
			backgroundColor="surface.background"
			zIndex={9999}
		>
			<VStack
				gap="2rem"
				css={{
					height: '100%',
					width: '100%',
					margin: 'auto',
					justifyContent: 'center',
					alignItems: 'center',
					fontSize: '1.6rem',
				}}
			>
				<Spinner size="lg" color="primary" />
			</VStack>
		</Box>
	);
};
