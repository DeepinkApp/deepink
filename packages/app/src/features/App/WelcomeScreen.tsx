import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Button, HStack, Link, Text, VStack } from '@chakra-ui/react';
import { Features } from '@components/Features/Features';
import { FeaturesGroup } from '@components/Features/Group';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';

import { CenterBox } from './CenterBox';
import { Appearance } from './Settings/sections/appearance/Appearance';
import { LanguagePicker } from './Settings/sections/GeneralSettings';

export const WelcomeScreen = ({ onConfirm }: { onConfirm: () => void }) => {
	const { t: tSettings } = useTranslation(LOCALE_NAMESPACE.settings);
	const { t } = useTranslation(LOCALE_NAMESPACE.introduction);

	return (
		<CenterBox maxWidth="600px">
			<VStack alignItems="start" gap="2rem">
				<VStack width="100%" gap="1rem">
					<Text as="h3" fontSize="2rem" w="100%" textAlign="center">
						{t('welcome.title')}
					</Text>
					<Text variant="secondary">{t('welcome.description')}</Text>
				</VStack>

				<Features width="100%">
					<FeaturesGroup>
						<FeaturesOption
							title={tSettings('general.language.title')}
							description={tSettings('general.language.description')}
						>
							<LanguagePicker />
						</FeaturesOption>
					</FeaturesGroup>

					<Appearance />
				</Features>

				<VStack width="100%" gap="1rem">
					<Text textAlign="center" width="100%">
						<Trans
							t={t}
							i18nKey="welcome.terms"
							components={{
								terms: <Link href="https://deepink.app/terms/" />,
								privacy: <Link href="https://deepink.app/privacy/" />,
							}}
						/>
					</Text>

					<HStack w="100%" flexWrap="wrap" justify="center">
						<Button variant="accent" minWidth="200px" onClick={onConfirm}>
							{t('welcome.continue')}
						</Button>
					</HStack>
				</VStack>
			</VStack>
		</CenterBox>
	);
};
