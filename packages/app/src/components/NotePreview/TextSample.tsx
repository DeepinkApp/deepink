import React, { useMemo } from 'react';
import { Text } from '@chakra-ui/react';
import { findTextSegments } from '@utils/text/findTextSegments';
import { getHighlightedText } from '@utils/text/getHighlightedText';

/**
 * Render text sample and highlight terms or similar texts
 */
export const TextSample = ({
	text,
	highlightText,
	lengthLimit,
}: {
	text: string;
	highlightText?: string;
	lengthLimit?: number;
}) => {
	const highlightSegments = useMemo(() => {
		return getHighlightedText(
			text,
			highlightText
				? findTextSegments(text, highlightText, {
						similarity: 0.7,
						joinDistance: 20,
					})
				: [],
			{ limit: lengthLimit },
		);
	}, [lengthLimit, highlightText, text]);

	return (
		<>
			{highlightSegments.map((segment, index) => {
				const content = text.slice(segment.start, segment.end);

				return segment.highlight ? (
					<Text
						backgroundColor="highlight.background"
						color="highlight.foreground"
						asChild
					>
						<mark key={index}>{content}</mark>
					</Text>
				) : (
					content
				);
			})}
		</>
	);
};
