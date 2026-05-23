import React, { PropsWithChildren, ReactNode } from 'react';
import { Text, VStack } from '@chakra-ui/react';

export type VaultsFormProps = PropsWithChildren<{
	title?: ReactNode;
	controls?: ReactNode;
}>;

export const VaultsForm = ({ title, controls, children }: VaultsFormProps) => {
	return (
		<VStack alignItems="start" gap="1.5rem">
			<VStack alignItems="start" w="100%" gap="1rem">
				{title && (
					<Text as="h3" variant="secondary" fontSize="20px">
						{title}
					</Text>
				)}

				{children}
			</VStack>

			{controls && <VStack w="100%">{controls}</VStack>}
		</VStack>
	);
};
