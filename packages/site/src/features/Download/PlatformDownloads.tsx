import React, { type ReactNode } from 'react';
import { BiCloudDownload } from 'react-icons/bi';
import { Box, Heading, HStack, Stack, VStack } from '@chakra-ui/react';

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
		<VStack gap="1.5rem" maxWidth="100%">
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

			<VStack align="center" gap="1.5rem" maxWidth="100%">
				<Stack
					gap=".5rem"
					align="start"
					separator={
						<Box
							paddingInline=".1rem"
							display={{ base: 'none', md: 'block' }}
						>
							|
						</Box>
					}
					alignItems="center"
					direction={{ base: 'column', md: 'row' }}
				>
					{links.map((link) => (
						<Link
							key={link.url}
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
							<HStack gap=".3em">
								<Box as={BiCloudDownload} />
								<span>{link.title}</span>
							</HStack>
						</Link>
					))}
				</Stack>

				{content && <Box width="100%">{content}</Box>}
			</VStack>
		</VStack>
	);
};
