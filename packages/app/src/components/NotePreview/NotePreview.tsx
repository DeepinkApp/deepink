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

				<Button
					variant="ghost"
					size="xs"
					alignSelf="baseline"
					aria-label={pin.title}
					title={pin.title}
					color={pin.isActive ? undefined : 'typography.secondary'}
					visibility={pin.isActive ? 'visible' : 'hidden'}
					_groupHover={{
						visibility: 'visible',
					}}
					_groupFocusWithin={{
						visibility: 'visible',
					}}
					_focus={{
						visibility: 'visible',
					}}
					onClick={(evt) => {
						evt.stopPropagation();
						pin.onToggle();
					}}
				>
					<Box as={FaThumbtack} />
				</Button>
			</HStack>

			{meta && <Box sx={styles.meta}>{meta}</Box>}
		</VStack>
	);
});

NotePreview.displayName = 'NotePreview';
