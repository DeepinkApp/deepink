import React, { useReducer } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import ms from 'ms';
import { getAbout } from 'src/about';
import { LOCALE_NAMESPACE, supportedLanguages } from 'src/i18n';
import languageNames from 'src/i18n/language-names.json';
import z from 'zod';
import Logo from '@assets/icons/app.svg';
import {
	Box,
	Button,
	Link,
	NativeSelect,
	Separator,
	Text,
	VStack,
} from '@chakra-ui/react';
import { Features } from '@components/Features/Features';
import { FeaturesGroup, FeaturesPanel } from '@components/Features/Group';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';
import { SimpleSwitch } from '@components/SimpleSwitch';
import { AppVersionInfo } from '@electron/updates/AppUpdatesChecker';
import { useGetAppUpdates } from '@features/App/useGetAppUpdates';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import {
	selectAppLanguage,
	selectIsCheckForUpdatesEnabled,
	selectVaultLockConfig,
} from '@state/redux/settings/selectors/preferences';
import { settingsApi } from '@state/redux/settings/settings';
import { wait } from '@utils/time';

type UpdateState = {
	state: 'pending' | 'result' | null;
	newVersion: AppVersionInfo | null;
};

export const LanguagePicker = () => {
	const dispatch = useAppDispatch();

	const language = useAppSelector(selectAppLanguage);

	return (
		<NativeSelect.Root size="sm" width="auto">
			<NativeSelect.Field
				value={language}
				onChange={(evt) => {
					dispatch(settingsApi.setLanguage(evt.target.value));
				}}
				textTransform="capitalize"
			>
				{supportedLanguages.map((code) => {
					return (
						<option key={code} value={code}>
							{code in languageNames
								? languageNames[code as keyof typeof languageNames]
								: code}
						</option>
					);
				})}
			</NativeSelect.Field>
			<NativeSelect.Indicator />
		</NativeSelect.Root>
	);
};

export const GeneralSettings = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.settings);
	const dispatch = useAppDispatch();

	const vaultLockConfig = useAppSelector(selectVaultLockConfig);
	const isCheckForUpdatesEnabled = useAppSelector(selectIsCheckForUpdatesEnabled);

	const getAppUpdates = useGetAppUpdates();
	const [appUpdatesState, updateAppUpdatesState] = useReducer<
		UpdateState,
		[Partial<UpdateState>]
	>((state, args) => ({ ...state, ...args }), { state: null, newVersion: null });

	return (
		<Features>
			<FeaturesPanel align="center" paddingBlock="2rem">
				<Box boxSize="100px" asChild>
					<Logo />
				</Box>

				<VStack gap=".3rem">
					<Text fontSize="1.5rem" lineHeight="1">
						{t('general.title')}
					</Text>
					<Text variant="secondary">{t('general.subtitle')}</Text>
				</VStack>

				<Separator />

				<FeaturesOption title={t('general.version.title')}>
					<VStack gap=".3rem" align="start" width="100%">
						<VStack gap=".5rem" align="start" paddingTop=".4rem">
							<Text fontWeight="bold">{getAbout().version}</Text>
							<Button
								size="sm"
								type="submit"
								loading={appUpdatesState.state === 'pending'}
								onClick={() => {
									updateAppUpdatesState({
										state: 'pending',
										newVersion: null,
									});

									// Ensure minimal time to prevent blinking
									Promise.all([getAppUpdates(true), wait(ms('1s'))])
										.then(([newVersion]) => {
											updateAppUpdatesState({ newVersion });
										})
										.finally(() =>
											updateAppUpdatesState({ state: 'result' }),
										);
								}}
							>
								{t('general.version.checkForUpdates')}
							</Button>
						</VStack>

						{appUpdatesState.state === 'result' && (
							<>
								{appUpdatesState.newVersion === null ? (
									<Text variant="secondary">
										{t('general.version.upToDate')}
									</Text>
								) : (
									<Text variant="secondary">
										<Trans
											i18nKey="general.version.newVersionAvailable"
											ns={LOCALE_NAMESPACE.settings}
											values={{
												version:
													appUpdatesState.newVersion.version,
											}}
											components={{ bold: <b /> }}
										/>{' '}
										<Link href={appUpdatesState.newVersion.url}>
											{t('general.version.downloadLatest')}
										</Link>{' '}
										{t('general.version.downloadDescription')}
									</Text>
								)}
							</>
						)}
					</VStack>
				</FeaturesOption>

				<FeaturesOption description={t('general.autoCheckUpdates.description')}>
					<SimpleSwitch
						size="sm"
						checked={isCheckForUpdatesEnabled}
						onCheckedChange={(details) => {
							dispatch(settingsApi.setCheckForUpdates(details.checked));
						}}
					>
						{t('general.autoCheckUpdates.label')}
					</SimpleSwitch>
				</FeaturesOption>
			</FeaturesPanel>
			<FeaturesGroup>
				<FeaturesOption
					title={t('general.language.title')}
					description={t('general.language.description')}
				>
					<LanguagePicker />
				</FeaturesOption>

				<FeaturesOption
					title={t('general.notifications.title')}
					description={t('general.notifications.description')}
				>
					<SimpleSwitch size="sm" defaultChecked>
						{t('general.notifications.useSystem')}
					</SimpleSwitch>
				</FeaturesOption>
			</FeaturesGroup>
			<FeaturesGroup title={t('general.vaultLock.groupTitle')}>
				<FeaturesOption
					description={t('general.vaultLock.lockOnSystemLock.description')}
				>
					<SimpleSwitch
						size="sm"
						checked={vaultLockConfig.lockOnSystemLock}
						onCheckedChange={(details) => {
							dispatch(
								settingsApi.setVaultLockConfig({
									lockOnSystemLock: details.checked,
								}),
							);
						}}
					>
						{t('general.vaultLock.lockOnSystemLock.label')}
					</SimpleSwitch>
				</FeaturesOption>
				<FeaturesOption
					title={t('general.vaultLock.lockAfterIdle.title')}
					description={t('general.vaultLock.lockAfterIdle.description')}
				>
					<NativeSelect.Root size="sm" width="auto">
						<NativeSelect.Field
							value={vaultLockConfig.lockAfterIdle ?? 'never'}
							onChange={(evt) => {
								const result = z.coerce
									.number()
									.or(z.literal('never'))
									.transform((value) =>
										value === 'never' ? null : value,
									)
									.safeParse(evt.target.value);

								dispatch(
									settingsApi.setVaultLockConfig({
										lockAfterIdle: result.success
											? result.data
											: null,
									}),
								);
							}}
						>
							<option value="never">
								{t('general.vaultLock.lockAfterIdle.never')}
							</option>
							<option value={ms('5m')}>
								{t('general.vaultLock.lockAfterIdle.minutes5')}
							</option>
							<option value={ms('10m')}>
								{t('general.vaultLock.lockAfterIdle.minutes10')}
							</option>
							<option value={ms('15m')}>
								{t('general.vaultLock.lockAfterIdle.minutes15')}
							</option>
							<option value={ms('30m')}>
								{t('general.vaultLock.lockAfterIdle.minutes30')}
							</option>
							<option value={ms('1h')}>
								{t('general.vaultLock.lockAfterIdle.hour1')}
							</option>
							<option value={ms('2h')}>
								{t('general.vaultLock.lockAfterIdle.hours2')}
							</option>
							<option value={ms('3h')}>
								{t('general.vaultLock.lockAfterIdle.hours3')}
							</option>
							<option value={ms('5h')}>
								{t('general.vaultLock.lockAfterIdle.hours5')}
							</option>
						</NativeSelect.Field>
						<NativeSelect.Indicator />
					</NativeSelect.Root>
				</FeaturesOption>
			</FeaturesGroup>
		</Features>
	);
};
