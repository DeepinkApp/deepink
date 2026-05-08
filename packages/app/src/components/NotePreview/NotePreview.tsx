import React, { forwardRef, ReactNode } from 'react';
import { FaThumbtack } from 'react-icons/fa6';
import {
	Box,
	HStack,
	StackProps,
	Text,
	useMultiStyleConfig,
	VStack,
} from '@chakra-ui/react';

import { TextSample } from './TextSample';

export const NotePreview = forwardRef<
	HTMLDivElement,
	{
		title: string;
		text: string;
		meta?: ReactNode;
		isSelected?: boolean;
		isPinned: boolean;
		textToHighlight?: string;
		isFlashing?: boolean;
	} & StackProps
>(
	(
		{
			title,
			text,
			textToHighlight,
			meta,
			isSelected,
			isPinned,
			isFlashing,
			...props
		},
		ref,
	) => {
		const styles = useMultiStyleConfig('NotePreview');
		return (
			<VStack
				ref={ref}
				aria-selected={isSelected}
				data-flashing={isFlashing}
				{...props}
				sx={{
					...styles.root,
					...props.sx,
				}}
				role="group"
			>
				<VStack sx={styles.body}>
					<HStack sx={styles.header}>
						<Text as="h3" sx={styles.title}>
							<TextSample
								text={title}
								highlightText={textToHighlight}
								lengthLimit={50}
							/>
						</Text>

						{isPinned && (
							<Box sx={styles.icon}>
								<FaThumbtack />
							</Box>
						)}
					</HStack>

					{text.length > 0 ? (
						<Text sx={styles.text}>
							<TextSample
								text={text}
								highlightText={textToHighlight}
								lengthLimit={150}
							/>
						</Text>
					) : undefined}
				</VStack>

				{meta && <Box sx={styles.meta}>{meta}</Box>}
			</VStack>
		);
	},
);

NotePreview.displayName = 'NotePreview';
