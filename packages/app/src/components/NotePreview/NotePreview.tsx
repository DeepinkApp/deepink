import React, { forwardRef, memo, useMemo } from 'react';
import { FaThumbtack } from 'react-icons/fa6';
import { isEqual } from 'lodash';
import { Box, HStack, Stack, StackProps, Text, useSlotRecipe } from '@chakra-ui/react';
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
		isPinned,
	}: {
		title: string;
		text: string;
		meta?: NotePreviewMeta;
		textToHighlight?: string;
		isPinned?: boolean;
	}) => {
		const recipe = useSlotRecipe({ key: 'notePreview' });
		const styles = recipe();
		const localizedDate = useLocalizedDate();

		return (
			<>
				<Stack css={styles.body}>
					<HStack css={styles.header}>
						<Text as="h3" css={styles.title}>
							<TextSample
								text={title}
								highlightText={textToHighlight}
								lengthLimit={50}
							/>
						</Text>

						{isPinned && (
							<Box
								as={FaThumbtack}
								css={styles.icon}
								transform="rotate(45deg)"
							/>
						)}
					</HStack>

					{text.length > 0 ? (
						<Text css={styles.text}>
							<TextSample
								text={text}
								highlightText={textToHighlight}
								lengthLimit={150}
							/>
						</Text>
					) : undefined}
				</Stack>

				{meta && meta.updatedAt !== undefined && (
					<Box css={styles.meta}>
						<Text>{localizedDate(new Date(meta.updatedAt))}</Text>
					</Box>
				)}
			</>
		);
	},
	isEqual,
);

NotePreviewContent.displayName = 'NotePreviewContent';

export const NotePreview = forwardRef<
	HTMLDivElement,
	{
		title: string;
		text: string;
		meta?: NotePreviewMeta;
		isSelected?: boolean;
		textToHighlight?: string;
		isPinned?: boolean;
	} & StackProps
>(({ title, text, textToHighlight, meta, isSelected, isPinned, ...props }, ref) => {
	const recipe = useSlotRecipe({ key: 'notePreview' });
	const styles = recipe();

	const style = useMemo(
		() => ({
			...styles.root,
		}),
		[styles.root],
	);

	return (
		<Stack ref={ref} aria-selected={isSelected} {...props} css={style}>
			<NotePreviewContent {...{ title, text, textToHighlight, meta, isPinned }} />
		</Stack>
	);
});

NotePreview.displayName = 'NotePreview';
