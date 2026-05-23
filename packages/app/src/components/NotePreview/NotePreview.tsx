import React, { forwardRef, memo, useMemo } from 'react';
import { isEqual } from 'lodash';
import { Box, Stack, StackProps, Text, useSlotRecipe, VStack } from '@chakra-ui/react';
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
		textToHighlight?: string;
	}) => {
		const recipe = useSlotRecipe({ key: 'notePreview' });
		const styles = recipe();
		const localizedDate = useLocalizedDate();

		return (
			<>
				<Stack css={styles.body}>
					<Text as="h3" css={styles.title}>
						<TextSample
							text={title}
							highlightText={textToHighlight}
							lengthLimit={50}
						/>
					</Text>

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
	} & StackProps
>(({ title, text, textToHighlight, meta, isSelected, ...props }, ref) => {
	const recipe = useSlotRecipe({ key: 'notePreview' });
	const styles = recipe();

	const style = useMemo(
		() => ({
			...styles.root,
		}),
		[styles.root],
	);

	return (
		<VStack ref={ref} aria-selected={isSelected} {...props} css={style}>
			<NotePreviewContent {...{ title, text, textToHighlight, meta }} />
		</VStack>
	);
});

NotePreview.displayName = 'NotePreview';
