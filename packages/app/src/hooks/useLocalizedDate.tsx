import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

export const useLoadedLanguage = () => {
	return useTranslation().i18n.language;
};

export const useLocalizedDate = () => {
	const language = useLoadedLanguage();

	return useCallback(
		(date: Date, format?: string) => {
			if (!format)
				return new Intl.DateTimeFormat(language, {
					weekday: 'short',
					month: 'short',
					day: '2-digit',
					year: 'numeric',
				}).format(date);

			return dayjs(date).locale(language).format(format);
		},
		[language],
	);
};
