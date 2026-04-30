import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Divider, Select } from '@chakra-ui/react';
import { FeaturesGroup } from '@components/Features/Group';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { selectTheme, settingsApi } from '@state/redux/settings/settings';
import { getDevicePixelRatio } from '@utils/os/zoom';

import { AppZoomLevel } from './AppZoomLevel';
import { ColorPicker } from './ColorPicker';

export const ThemePicker = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.settings);
	const dispatch = useAppDispatch();
	const theme = useAppSelector(selectTheme);

	return (
		<Select
			value={theme.name}
			size="sm"
			width="auto"
			onChange={(e) => {
				dispatch(
					settingsApi.setTheme({
						name: e.target.value as any,
					}),
				);
			}}
		>
			<option value="auto">{t('appearance.theme.auto')}</option>
			<option value="dark">{t('appearance.theme.dark')}</option>
			<option value="light">{t('appearance.theme.light')}</option>
			<option value="zen">{t('appearance.theme.zen')}</option>
		</Select>
	);
};

export const AccentColorPicker = () => {
	const dispatch = useAppDispatch();
	const theme = useAppSelector(selectTheme);

	return (
		<ColorPicker
			isDisabled={theme.name === 'zen'}
			color={theme.accentColor}
			onChange={(color) => {
				dispatch(
					settingsApi.setTheme({
						accentColor: color,
					}),
				);
			}}
		/>
	);
};

export const Appearance = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.settings);
	const theme = useAppSelector(selectTheme);

	const dpr = useMemo(() => Math.round(getDevicePixelRatio() * 10) / 10, []);

	return (
		<FeaturesGroup>
			<FeaturesOption title={t('appearance.theme.title')}>
				<ThemePicker />
			</FeaturesOption>

			<FeaturesOption
				title={t('appearance.accentColor.title')}
				description={
					theme.name === 'zen'
						? t('appearance.accentColor.zenNotApplicable')
						: undefined
				}
			>
				<AccentColorPicker />
			</FeaturesOption>

			<Divider />

			<FeaturesOption
				title={t('appearance.zoomLevel.title')}
				description={t('appearance.zoomLevel.description', {
					dpr,
				})}
			>
				<AppZoomLevel />
			</FeaturesOption>
		</FeaturesGroup>
	);
};
