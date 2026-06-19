import React, { type ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
	Box,
	Heading,
	Image,
	Separator,
	SimpleGrid,
	Stack,
	VStack,
} from '@chakra-ui/react';

import { ANALYTICS_EVENT } from '../../components/analytics';
import { useAnalytics } from '../../components/analytics/useAnalytics';
import { WithLayout } from '../../components/Layout';
import { Link } from '../../components/Link';
import { useLocalePath } from '../../components/Locale';
import { Text } from '../../components/Text';
import { TheRock } from '../../components/TheRock';

import { FAQ } from './FAQ';
import screenshot from './screenshots/app.png';
import encryptionScreenshot from './screenshots/encryption.png';
import historyScreenshot from './screenshots/history.png';
import linksScreenshot from './screenshots/links.png';
import remindersScreenshot from './screenshots/reminders.png';
import tagsScreenshot from './screenshots/tags.png';
import workspacesScreenshot from './screenshots/workspaces.png';

export default WithLayout(() => {
	const analytics = useAnalytics();
	const localePath = useLocalePath();

	const { t } = useTranslation('landing');

	const highlights: {
		title: string;
		content: ReactNode;
	}[] = [
		{
			title: t('highlights.content.encryption.title'),
			content: (
				<Trans
					t={t}
					i18nKey="highlights.content.encryption.text"
					components={{
						encryption: <Link href="/concepts/vault/#encryption" />,
						security: <Link href="/reference/encryption/" />,
						opensource: (
							<Link
								href="https://github.com/DeepinkApp/deepink"
								target="_blank"
							/>
						),
					}}
				/>
			),
		},
		{
			title: t('highlights.content.workflow.title'),
			content: (
				<Trans
					t={t}
					i18nKey="highlights.content.workflow.text"
					components={[<Link key={1} href="/blog/the-workflow-cost" />]}
				/>
			),
		},
		{
			title: t('highlights.content.universality.title'),
			content: (
				<Trans
					t={t}
					i18nKey="highlights.content.universality.text"
					components={{
						organizing: <Link href="/guides/organizing-notes/" />,
						workspace: <Link href="/concepts/workspace/" />,
					}}
				/>
			),
		},
	];

	const features: {
		title: string;
		content: ReactNode;
		image: ImageMetadata;
	}[] = [
		{
			title: t('features.content.links.title'),
			content: <Trans t={t} i18nKey="features.content.links.text" />,
			image: linksScreenshot,
		},
		{
			title: t('features.content.workspaces.title'),
			content: (
				<Trans
					t={t}
					i18nKey="features.content.workspaces.text"
					components={{
						workspace: <Link href="/concepts/workspace/" />,
						isolation: <Link href="/concepts/workspace/#isolation" />,
					}}
				/>
			),
			image: workspacesScreenshot,
		},
		{
			title: t('features.content.history.title'),
			content: (
				<Trans
					t={t}
					i18nKey="features.content.history.text"
					components={{
						history: <Link href="/concepts/snapshots/" />,
					}}
				/>
			),
			image: historyScreenshot,
		},
		{
			title: t('features.content.reminders.title'),
			content: <Trans t={t} i18nKey="features.content.reminders.text" />,
			image: remindersScreenshot,
		},
		{
			title: t('features.content.tags.title'),
			content: (
				<Trans
					t={t}
					i18nKey="features.content.tags.text"
					components={{
						tags: <Link href="/guides/organizing-notes/#tagging" />,
					}}
				/>
			),
			image: tagsScreenshot,
		},
		{
			title: t('features.content.encryption.title'),
			content: (
				<Trans
					t={t}
					i18nKey="features.content.encryption.text"
					components={{
						encryption: <Link href="/concepts/vault/#encryption" />,
						reference: <Link href="/reference/encryption/" />,
					}}
				/>
			),
			image: encryptionScreenshot,
		},
	];

	return (
		<>
			{/* Hero Section */}
			<VStack
				gap={{ base: '2rem', md: '3rem' }}
				marginBlockStart={{ base: '2rem', md: '4rem' }}
				marginBlockEnd="5rem"
				align="start"
			>
				<VStack gap="1.6rem" align="start">
					<Heading
						as="h2"
						m={0}
						fontWeight="500"
						fontSize={{ base: '2.8rem', md: '3.8rem' }}
						lineHeight={{ base: '2.9rem', md: '3.9rem' }}
						color="brand.heroHeader"
					>
						{t('hero.title')}
					</Heading>
					<Text
						fontSize={{ base: '1.6rem', md: '2rem' }}
						lineHeight={{ base: '2.6rem', md: '2.8rem' }}
						m={0}
						color="brand.secondary"
					>
						<Trans t={t} i18nKey="hero.subtitle" />
					</Text>
					<Stack
						gap="0.8rem"
						marginTop="1rem"
						direction={{ base: 'column', sm: 'row' }}
						flexWrap="wrap"
						width="100%"
					>
						<Link
							href={localePath('/download')}
							variant="button-primary"
							fontSize={{ base: '1.1rem', md: '1.3rem' }}
							lineHeight={{ base: '2rem', md: '1.8rem' }}
							width={{ base: '100%', sm: 'auto' }}
							textAlign={{ base: 'center', sm: 'start' }}
							onClick={analytics.callback(
								ANALYTICS_EVENT.DOWNLOAD_BUTTON_CLICK,
								{
									context: 'Landing: Top',
								},
							)}
						>
							{t('hero.button.get')}
						</Link>
						<Link
							href={localePath('/#features')}
							variant="button-secondary"
							fontSize={{ base: '1.1rem', md: '1.3rem' }}
							lineHeight={{ base: '2rem', md: '1.8rem' }}
							width={{ base: '100%', sm: 'auto' }}
							textAlign={{ base: 'center', sm: 'start' }}
							onClick={analytics.callback(ANALYTICS_EVENT.FEATURES_CLICK)}
						>
							{t('hero.button.features')}
						</Link>
					</Stack>
				</VStack>
				<Image
					src={screenshot.src}
					style={{
						aspectRatio: `${screenshot.width}/${screenshot.height}`,
					}}
					borderRadius="18px"
					border="1px solid #00000017"
				/>
			</VStack>

			{/* Summary Section */}
			<Stack
				gap="2rem"
				rowGap={{ base: '3rem', sm: '10rem' }}
				my="5rem"
				direction={{ base: 'column', lg: 'row' }}
			>
				<VStack gap="3rem" align="start">
					{highlights.map((feature) => (
						<VStack key={feature.title} gap="1rem" align="start">
							<Heading as="h3" m={0} fontSize="1.8rem" fontWeight="500">
								{feature.title}
							</Heading>
							<Text
								m={0}
								fontSize="1.4rem"
								lineHeight="2rem"
								color="brand.secondary"
								whiteSpace="pre-line"
							>
								{feature.content}
							</Text>
						</VStack>
					))}
				</VStack>

				<VStack
					align="center"
					gap="2rem"
					minW={{ md: '200px', lg: '300px' }}
					marginInlineStart={{ lg: 'auto' }}
				>
					<TheRock maxW="300px" width={{ base: '350px', md: '100%' }} />

					<VStack
						align="center"
						gap="1rem"
						width="100%"
						fontSize={{ base: '1.1rem', md: '1.3rem' }}
						lineHeight={{ base: '1.3rem', md: '1.8rem' }}
					>
						<Link
							href={localePath('/download')}
							variant="button-primary"
							width="100%"
							maxW={{ base: '100%', sm: '300px' }}
							textAlign="center"
							fontSize="inherit"
							lineHeight={{ base: '2rem', sm: 'inherit' }}
							onClick={analytics.callback(
								ANALYTICS_EVENT.DOWNLOAD_BUTTON_CLICK,
								{
									context: 'Landing: Highlights',
								},
							)}
						>
							{t('highlights.cta.button')}
						</Link>
						<Text textAlign="center" fontSize="inherit">
							{t('highlights.cta.text')}
						</Text>
					</VStack>
				</VStack>
			</Stack>

			{/* Features Section */}
			<Box maxW="100%" my="10rem">
				<VStack
					mb="3rem"
					align="start"
					gap="2rem"
					w="100%"
					id="features"
					scrollMarginBlock="3rem"
				>
					<Heading
						as="h3"
						fontSize="3.2rem"
						lineHeight="3.2rem"
						fontWeight="500"
						m={0}
					>
						{t('features.intro.title')}
					</Heading>
					<Text
						color="brand.secondary"
						css={{
							base: { fontSize: '1.6rem', lineHeight: '2.4rem' },
							md: {
								fontSize: '2rem',
								lineHeight: '2.8rem',
								whiteSpace: 'pre-line',
							},
						}}
					>
						{t('features.intro.text')}
					</Text>
					<Separator width="100%" />
				</VStack>

				<SimpleGrid columns={{ base: 1, md: 2 }} gap="2rem" rowGap="3rem">
					{features.map((feature) => (
						<VStack key={feature.title} gap="0.5rem" align="start">
							<Heading
								as="h3"
								m={0}
								fontSize="2rem"
								lineHeight="2.8rem"
								fontWeight="500"
								mb="0.3rem"
							>
								{feature.title}
							</Heading>
							<Text
								m={0}
								fontSize="1.3rem"
								lineHeight="1.8rem"
								mb="0.5rem"
								color="brand.secondary"
								as="div"
								whiteSpace="pre-line"
							>
								{feature.content}
							</Text>
							<Box
								overflow="hidden"
								m={0}
								border="1px solid #00000017"
								borderRadius="14px"
								maxH="300px"
							>
								<Image
									src={feature.image.src}
									style={{
										aspectRatio: `${feature.image.width}/${feature.image.height}`,
									}}
									objectFit="contain"
									minW="100%"
								/>
							</Box>
						</VStack>
					))}
				</SimpleGrid>
			</Box>

			{/* CTA Section */}
			<VStack
				minH="100vh"
				align="center"
				justify="start"
				gap="3rem"
				boxSizing="border-box"
				// Ensure space on top for all
				paddingTop="15%"
			>
				<Heading
					as="h3"
					m={0}
					fontSize={{ base: '2.4rem', md: '3.8rem' }}
					lineHeight={{ base: '2.9rem', md: '3.9rem' }}
					textAlign="center"
				>
					{t('cta.title')}
				</Heading>
				<Text
					maxW={{ base: undefined, md: '80%' }}
					fontSize={{ base: '1.6rem', md: '2rem' }}
					lineHeight={{ base: '2.6rem', md: '2.8rem' }}
					textAlign="center"
					m={0}
				>
					{t('cta.text')}
				</Text>
				<Link
					href={localePath('/download')}
					variant="button-primary"
					fontSize={{ base: '1.4rem', md: '1.6rem' }}
					lineHeight={{ base: '2rem', md: '2.2rem' }}
					paddingInline="2rem"
					onClick={analytics.callback(ANALYTICS_EVENT.DOWNLOAD_BUTTON_CLICK, {
						context: 'Landing: CTA',
					})}
				>
					{t('cta.button')}
				</Link>
			</VStack>

			<FAQ />

			<Box
				// Ensure space on bottom for mobiles
				paddingBottom="10rem"
			/>
		</>
	);
});
