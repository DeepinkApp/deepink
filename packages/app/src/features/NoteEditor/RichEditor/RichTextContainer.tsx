import React, { memo } from 'react';
import { Box, BoxProps } from '@chakra-ui/react';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';

export type RichTextContainerProps = BoxProps & {
	placeholder?: string;
};

export const RichTextContainer = memo(
	({ placeholder, ...props }: RichTextContainerProps) => {
		return (
			<RichTextPlugin
				contentEditable={
					<Box
						w="100%"
						maxH="100%"
						outline="none"
						padding="1rem 1rem 5rem"
						overflow="auto"
						{...props}
						asChild
					>
						<ContentEditable />
					</Box>
				}
				placeholder={
					placeholder ? (
						<Box
							position="absolute"
							top={0}
							left={0}
							right={0}
							bottom={0}
							padding="1rem 1rem 5rem"
							pointerEvents="none"
							// TODO: use styles from theme
							color="typography.secondary"
						>
							{placeholder}
						</Box>
					) : undefined
				}
				ErrorBoundary={LexicalErrorBoundary}
			/>
		);
	},
);

RichTextContainer.displayName = 'RichTextContainer';
