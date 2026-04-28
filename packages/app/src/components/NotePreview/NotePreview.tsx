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
		textToHighlight?: string;
	} & StackProps
>(({ title, text, textToHighlight, meta, isSelected, pin, ...props }, ref) => {
	const styles = useMultiStyleConfig('NotePreview');
	return (
		<VStack
			ref={ref}
			aria-selected={isSelected}
			{...props}
			sx={{
				...styles.root,
				...props.sx,
			}}
			role="group"
		>
			<HStack w="100%" justifyContent="space-between">
				<VStack sx={styles.body}>
					<Text as="h3" sx={styles.title}>
						<TextSample
							text={title}
							highlightText={textToHighlight}
							lengthLimit={50}
						/>
					</Text>

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

				<Box
					as={FaThumbtack}
					onClick={pin.onToggle}
					title={pin.title}
					boxSize="13px"
					opacity={pin.isActive ? 1 : 0}
					color={pin.isActive ? 'typography.base' : 'typography.secondary'}
					transform="rotate(25deg)"
					_groupHover={{
						opacity: 1,
					}}
					_active={{
						transform: 'rotate(25deg) scale(1.1)',
					}}
				/>
			</HStack>

			{meta && <Box sx={styles.meta}>{meta}</Box>}
		</VStack>
	);
});

NotePreview.displayName = 'NotePreview';
