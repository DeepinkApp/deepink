import type React from 'react';
import { CodeBlock, type CodeBlockRootProps, Float, IconButton } from '@chakra-ui/react';

export const SimpleCodeBlock = (props: Omit<CodeBlockRootProps, 'children'>) => {
	return (
		<CodeBlock.Root width="100%" size="md" {...props}>
			<CodeBlock.Content>
				<Float placement="middle-end" offset={[5, 5]} zIndex="1">
					<CodeBlock.CopyTrigger asChild>
						<IconButton variant="ghost" size="sm">
							<CodeBlock.CopyIndicator />
						</IconButton>
					</CodeBlock.CopyTrigger>
				</Float>
				<CodeBlock.Code margin={0}>
					<CodeBlock.CodeText paddingRight="3rem" />
				</CodeBlock.Code>
			</CodeBlock.Content>
		</CodeBlock.Root>
	);
};
