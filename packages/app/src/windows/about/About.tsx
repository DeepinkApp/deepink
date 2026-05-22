import React from 'react';
import { useTranslation } from 'react-i18next';
import { getAbout } from 'src/about';
import { LOCALE_NAMESPACE } from 'src/i18n';
import Logo from '@assets/icons/app.svg';
import { Box, Link, Text, VStack } from '@chakra-ui/react';

export const About = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.about);

	const { displayName, description, version, bugs } = getAbout();

	const versions = (globalThis as any).getEnvVersions() as NodeJS.ProcessVersions;

	return (
		<Box w="100vw" h="100vh" overflow="auto">
			<VStack gap="2rem" maxWidth="600px" margin="auto" padding="2rem">
				<VStack gap="1rem" maxWidth="600px" margin="auto">
					<Box boxSize="200px" asChild>
						<Logo />
					</Box>

					<VStack gap=".5rem">
						<Text fontSize="2rem">{displayName}</Text>
						<Text fontSize="1.3rem">{description}</Text>
						<Text fontSize="1rem">{t('version', { version })}</Text>
					</VStack>
				</VStack>

				<VStack gap=".5rem" w="100%">
					<Text fontSize="1.2rem">{t('environment')}</Text>

					<VStack color="typography.secondary" gap="0rem" align="start">
						{/* eslint-disable i18next/no-literal-string */}
						<Text>electron: {versions.electron}</Text>
						<Text>chrome: {versions.chrome}</Text>
						<Text>node: {versions.node}</Text>
						<Text>v8: {versions.v8}</Text>
						{/* eslint-enable i18next/no-literal-string */}
					</VStack>
				</VStack>

				<VStack gap=".5rem" w="100%">
					<Text fontSize="1.2rem">{t('links.label')}</Text>
					<Link href={bugs}>{t('links.reportBug')}</Link>
				</VStack>
			</VStack>
		</Box>
	);
};
