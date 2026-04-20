export enum LOCALE_NAMESPACE {
	common = 'common',
	introduction = 'introduction',
	vault = 'vault',
	workspace = 'workspace',
	features = 'features',
	settings = 'settings',
	menu = 'menu',
}

export const NAMESPACES = Object.values(LOCALE_NAMESPACE);

export const sourceLanguage = 'en';

export const supportedLanguages = [
	sourceLanguage,
	'ar',
	'fa',
	'he',
	'id',
	'th',
	'el',
	'ro',
	'fi',
	'nl',
	'hi',
	'bg',
	'ca',
	'cs',
	'da',
	'de',
	'es',
	'fr',
	'hu',
	'it',
	'ja',
	'ka',
	'ko',
	'nb',
	'pl',
	'pt-BR',
	'pt-PT',
	'ru',
	'sl',
	'sr',
	'sv',
	'tr',
	'uk',
	'vi',
	'zh-CN',
	'zh-TW',
];

export const getPreferredLanguage = (
	languages: readonly string[],
	defaultLanguage = sourceLanguage,
) => {
	const languagesList = new Map(supportedLanguages.map((lng, index) => [lng, index]));

	const foundLanguages = languages
		.map((language) => {
			if (languagesList.has(language)) return language;

			const languageBase = language.split('-')[0];
			if (languagesList.has(languageBase)) return languageBase;

			return null;
		})
		.filter((l) => l !== null)
		.sort((a, b) => (languagesList.get(b) ?? -1) - (languagesList.get(a) ?? -1));

	return foundLanguages.length > 0 ? foundLanguages[0] : defaultLanguage;
};
