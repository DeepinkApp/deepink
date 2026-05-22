import React, { FC } from 'react';
import { Text, TextProps } from '@chakra-ui/react';

export type FeaturesHeaderProps = TextProps;

export const FeaturesHeader: FC<FeaturesHeaderProps> = ({ children, ...rest }) => {
	return (
		<Text
			as="h2"
			{...rest}
			css={{
				marginLeft: '40%',
				fontSize: '18px',
				fontWeight: 'bold',

				'& &:not(:first-child)': {
					marginTop: '2rem',
				},
			}}
		>
			{children}
		</Text>
	);
};
