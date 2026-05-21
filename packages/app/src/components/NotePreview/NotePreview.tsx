import React, { forwardRef, memo, useMemo } from 'react';
import { isEqual } from 'lodash';
import { Box, StackProps, Text, useMultiStyleConfig, VStack } from '@chakra-ui/react';
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
		const styles = useMultiStyleConfig('NotePreview');
		const localizedDate = useLocalizedDate();

		return (
			<>
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

				{meta && meta.updatedAt !== undefined && (
					<Box sx={styles.meta}>
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
	const styles = useMultiStyleConfig('NotePreview');

	const style = useMemo(
		() => ({
			...styles.root,
			...props.sx,
		}),
		[props.sx, styles.root],
	);

	return (
		<VStack ref={ref} aria-selected={isSelected} {...props} sx={style}>
			<NotePreviewContent {...{ title, text, textToHighlight, meta }} />
		</VStack>
	);
});

NotePreview.displayName = 'NotePreview';
