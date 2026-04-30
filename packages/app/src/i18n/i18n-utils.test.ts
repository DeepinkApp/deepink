import { getPreferredLanguage } from '.';

describe('Pick preferred language', () => {
	test('Return default language for empty languages list', () => {
		expect(getPreferredLanguage([])).toBe('en');
		expect(getPreferredLanguage([], 'de')).toBe('de');
	});

	test('Return first supported language', () => {
		expect(getPreferredLanguage(['foo', 'bar', 'de'])).toBe('de');
	});

	test('Return default language when no language in list is supported', () => {
		expect(getPreferredLanguage(['foo', 'bar', 'baz'])).toBe('en');
		expect(getPreferredLanguage(['foo', 'bar', 'baz'], 'de')).toBe('de');
	});

	test('Return language with no dialect as fallback', () => {
		expect(getPreferredLanguage(['foo', 'ru-RU', 'baz'])).toBe('ru');
	});
});
