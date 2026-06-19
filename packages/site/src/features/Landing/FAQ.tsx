import type React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Accordion, Span } from '@chakra-ui/react';

import { Link } from '../../components/Link';

export const FAQ = () => {
	const { t } = useTranslation('faq');

	const faq = [
		{
			value: 'betterThanOthers',
			title: t('betterThanOthers.title'),
			text: (
				<Trans
					t={t}
					i18nKey="betterThanOthers.text"
					components={{
						security: <Link href="/introduction/security/" />,
					}}
				/>
			),
		},
		{
			value: 'differentFromOthers',
			title: t('differentFromOthers.title'),
			text: <Trans t={t} i18nKey="differentFromOthers.text" />,
		},
		{
			value: 'import',
			title: t('import.title'),
			text: (
				<Trans
					t={t}
					i18nKey="import.text"
					components={{
						import: <Link href="/guides/import-export/" />,
					}}
				/>
			),
		},
		{
			value: 'ergonomics',
			title: t('ergonomics.title'),
			text: <Trans t={t} i18nKey="ergonomics.text" />,
		},
		{
			value: 'nestedTags',
			title: t('nestedTags.title'),
			text: <Trans t={t} i18nKey="nestedTags.text" />,
		},
		{
			value: 'workspacesVsVaults',
			title: t('workspacesVsVaults.title'),
			text: <Trans t={t} i18nKey="workspacesVsVaults.text" />,
		},
		{
			value: 'workspacesVsFolders',
			title: t('workspacesVsFolders.title'),
			text: <Trans t={t} i18nKey="workspacesVsFolders.text" />,
		},
		{
			value: 'largeVaults',
			title: t('largeVaults.title'),
			text: <Trans t={t} i18nKey="largeVaults.text" />,
		},
		{
			value: 'stayingOrganized',
			title: t('stayingOrganized.title'),
			text: <Trans t={t} i18nKey="stayingOrganized.text" />,
		},
		{
			value: 'replaceMultipleApps',
			title: t('replaceMultipleApps.title'),
			text: <Trans t={t} i18nKey="replaceMultipleApps.text" />,
		},
		{
			value: 'connectedInformation',
			title: t('connectedInformation.title'),
			text: <Trans t={t} i18nKey="connectedInformation.text" />,
		},
		{
			value: 'privacy',
			title: t('privacy.title'),
			text: <Trans t={t} i18nKey="privacy.text" />,
		},
		{
			value: 'openSource',
			title: t('openSource.title'),
			text: <Trans t={t} i18nKey="openSource.text" />,
		},
		{
			value: 'personalOrWork',
			title: t('personalOrWork.title'),
			text: <Trans t={t} i18nKey="personalOrWork.text" />,
		},
		{
			value: 'oneVault',
			title: t('oneVault.title'),
			text: <Trans t={t} i18nKey="oneVault.text" />,
		},
		{
			value: 'markdownFiles',
			title: t('markdownFiles.title'),
			text: <Trans t={t} i18nKey="markdownFiles.text" />,
		},
		{
			value: 'export',
			title: t('export.title'),
			text: (
				<Trans
					t={t}
					i18nKey="export.text"
					components={{
						export: <Link href="/guides/import-export/" />,
						email: (
							<Link href="mailto:contact@deepink.app">
								contact@deepink.app
							</Link>
						),
					}}
				/>
			),
		},
	];

	return (
		<Accordion.Root
			variant="subtle"
			size="lg"
			multiple
			defaultValue={['betterThanOthers', 'differentFromOthers', 'import']}
		>
			{faq.map((item, index) => (
				<Accordion.Item key={index} value={item.value}>
					<Accordion.ItemTrigger minHeight="4rem">
						<Span flex="1">{item.title}</Span>
						<Accordion.ItemIndicator />
					</Accordion.ItemTrigger>
					<Accordion.ItemContent>
						<Accordion.ItemBody fontSize="1.2rem" whiteSpace="pre-line">
							{item.text}
						</Accordion.ItemBody>
					</Accordion.ItemContent>
				</Accordion.Item>
			))}
		</Accordion.Root>
	);
};
