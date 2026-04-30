import React, { PropsWithChildren, useEffect, useState } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import HttpApi, { HttpBackendOptions } from 'i18next-http-backend';
import { setAppLanguage } from '@electron/requests/interop/renderer';
import { SplashScreen } from '@features/SplashScreen';
import { useAppSelector } from '@state/redux/hooks';
import { selectAppLanguage } from '@state/redux/settings/selectors/preferences';

import { NAMESPACES, supportedLanguages } from './i18n';

export const LocalesProvider = ({ children }: PropsWithChildren) => {
	const language = useAppSelector(selectAppLanguage);

	const [i18nInstance, setI18nInstance] = useState<typeof i18n | null>(null);
	useEffect(() => {
		Promise.all([
			// Load locales for dayjs
			import(`dayjs/locale/${language}.js`).catch(() => {
				// We ignore the errors.
				// The fallback will be used in case the locale is not found
				console.warn(
					`Cannot find localization for language ${language} in dayjs`,
				);
			}),
			setAppLanguage(language),
			// Load i18next locales
			i18n
				.use(initReactI18next) // passes i18n down to react-i18next
				.use(HttpApi)
				.init<HttpBackendOptions>({
					lng: language,
					fallbackLng: 'en',
					// eslint-disable-next-line @cspell/spellchecker
					supportedLngs: supportedLanguages,

					ns: NAMESPACES,
					defaultNS: NAMESPACES,
					maxRetries: 1,

					backend: {
						loadPath:
							new URL('./locales', window.location.href).toString() +
							'/{{lng}}/{{ns}}.json',
					},

					interpolation: {
						escapeValue: false,
					},

					react: {
						useSuspense: false, // important since we manually wait
					},
				}),
		])

			.then(() => setI18nInstance(i18n));
	}, [language]);

	if (!i18nInstance) return <SplashScreen />;

	return (
		<I18nextProvider i18n={i18nInstance} defaultNS={NAMESPACES}>
			{children}
		</I18nextProvider>
	);
};
