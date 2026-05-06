import React, { type ReactNode } from 'react';
import { BiCloudDownload } from 'react-icons/bi';
import { Box, Heading, HStack, List, VStack } from '@chakra-ui/react';

import { ANALYTICS_EVENT } from '../../components/analytics';
import { useAnalytics } from '../../components/analytics/useAnalytics';
import { Link } from '../../components/Link';

export const PlatformDownloads = ({
	platform,
	icon,
	content,
	links,
}: {
	platform: string;
	icon?: ReactNode;
	content?: ReactNode;
	links: {
		title: string;
		url: string;
	}[];
}) => {
	const analytics = useAnalytics();

	return (
		<VStack gap="1.5rem" maxWidth="100%" align="start">
			<Heading
				as="h2"
				textAlign="start"
				fontSize="2rem"
				alignItems="start"
				margin={0}
			>
				<HStack as="span" gap=".3em" alignItems="center">
					{icon}
					<span>{platform}</span>
				</HStack>
			</Heading>

			<VStack align="start" gap="2rem" maxWidth="100%">
				<List.Root
					fontSize="1.2rem"
					margin={0}
					listStyle="none"
					paddingInlineStart="1rem"
				>
					{links.map((link) => (
						<List.Item key={link.url} _marker={{ color: 'inherit' }}>
							<List.Indicator asChild>
								<BiCloudDownload />
							</List.Indicator>
							<Link
								href={link.url}
								fontSize="inherit"
								onClick={analytics.callback(
									ANALYTICS_EVENT.DOWNLOAD_BUTTON_CLICK,
									{
										context: `Download page: Platform - ${platform}`,
										fileName: link.url.split('/').at(-1),
									},
								)}
							>
								{link.title}
							</Link>
						</List.Item>
					))}
				</List.Root>

				{content && <Box width="100%">{content}</Box>}
			</VStack>
		</VStack>
	);
};
