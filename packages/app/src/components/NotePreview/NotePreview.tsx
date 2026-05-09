import React, { forwardRef, memo, useMemo } from 'react';
import { isEqual } from 'lodash';
import { Box, Stack, StackProps, Text, useSlotRecipe } from '@chakra-ui/react';
import { useLocalizedDate } from '@hooks/useLocalizedDate';

import { TextSample } from './TextSample';

type NotePreviewMeta = {
	updatedAt?: number;
};

export const NotePreviewContent = memo(
	({
		title,
		text,
		textToHighlight,
		meta,
	}: {
		title: string;
		text: string;
		meta?: NotePreviewMeta;
		pin: {
			title: string;
			isActive: boolean;
			onToggle: () => void;
		};
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
				data-flashing={isFlashing || undefined}
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
