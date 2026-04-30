export enum LOCALE_NAMESPACE {
	about = 'about',
	common = 'common',
	encryption = 'encryption',
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
	const supported = new Set(supportedLanguages);
	for (const language of languages) {
		if (supported.has(language)) return language;

		const base = language.split('-')[0];
		if (supported.has(base)) return base;
	}

	return defaultLanguage;
};
