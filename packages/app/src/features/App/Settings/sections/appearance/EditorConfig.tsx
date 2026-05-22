import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Link, NativeSelect, Separator, Text, VStack } from '@chakra-ui/react';
import { FeaturesGroup } from '@components/Features/Group';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';
import { RelaxedInput } from '@components/RelaxedInput';
import { SimpleSwitch } from '@components/SimpleSwitch';
import { RelaxedSlider } from '@components/Slider/RelaxedSlider';
import { editorModes } from '@features/NotesContainer/EditorModePicker/EditorModePicker';
import { useLocalizedDate } from '@hooks/useLocalizedDate';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import {
	selectEditorConfig,
	selectEditorFontFamily,
} from '@state/redux/settings/selectors/preferences';
import {
	defaultSettings,
	EditorMode,
	selectEditorMode,
	settingsApi,
} from '@state/redux/settings/settings';

import { FontFamilyInput } from './FontFamilyInput';

export const EditorConfig = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.settings);
	const localizedDate = useLocalizedDate();

	const dispatch = useAppDispatch();
	const editorMode = useAppSelector(selectEditorMode);
	const editorConfig = useAppSelector(selectEditorConfig);
	const editorFontFamily = useAppSelector(selectEditorFontFamily);

	return (
		<>
			<FeaturesGroup title={t('editor.groupTitle')}>
				<FeaturesOption title={t('editor.mode.title')}>
					<NativeSelect.Root size="sm">
						<NativeSelect.Field
							value={editorMode}
							width="auto"
							onChange={(e) => {
								dispatch(
									settingsApi.setEditorMode(
										e.target.value as EditorMode,
									),
								);
							}}
						>
							{Object.entries(editorModes).map(([id, title]) => (
								<option key={id} value={id}>
									{title}
								</option>
							))}
						</NativeSelect.Field>
						<NativeSelect.Indicator />
					</NativeSelect.Root>
				</FeaturesOption>

				<FeaturesOption
					title={t('editor.fontFamily.title')}
					description={t('editor.fontFamily.description')}
				>
					<FontFamilyInput
						inputProps={{
							size: 'sm',
							placeholder: t('editor.fontFamily.placeholder'),
							fontFamily: editorFontFamily,
						}}
						fontSize={editorConfig.fontSize}
						value={editorConfig.fontFamily}
						onChange={(fontFamily) => {
							dispatch(settingsApi.setEditorConfig({ fontFamily }));
						}}
					/>
				</FeaturesOption>

				<FeaturesOption title={t('editor.fontSize.title')}>
					<RelaxedSlider
						min={10}
						max={30}
						resetValue={defaultSettings.editor.fontSize}
						value={editorConfig.fontSize}
						onChange={(value) => {
							dispatch(settingsApi.setEditorConfig({ fontSize: value }));
						}}
					/>
				</FeaturesOption>

				<FeaturesOption title={t('editor.lineHeight.title')}>
					<RelaxedSlider
						min={1.2}
						max={2}
						step={0.1}
						resetValue={defaultSettings.editor.lineHeight}
						value={editorConfig.lineHeight}
						onChange={(value) => {
							dispatch(settingsApi.setEditorConfig({ lineHeight: value }));
						}}
					/>
				</FeaturesOption>

				<Separator />

				<FeaturesOption
					title={t('editor.dateFormat.title')}
					description={
						<Trans
							i18nKey="editor.dateFormat.description"
							ns={LOCALE_NAMESPACE.settings}
							components={{
								formatLink: (
									<Link href="https://day.js.org/docs/en/display/format">
										{t('editor.dateFormat.formatReference')}
									</Link>
								),
							}}
						/>
					}
				>
					<RelaxedInput
						size="sm"
						placeholder="e.g., DD/MM/YYYY HH:mm"
						value={editorConfig.dateFormat}
						onValueChange={(value) => {
							dispatch(
								settingsApi.setEditorConfig({
									dateFormat: value,
								}),
							);
						}}
					/>

					{editorConfig.dateFormat.trim().length > 0 && (
						<VStack align="start" gap={0} maxWidth="100%">
							<Text fontSize=".8rem">{t('editor.dateFormat.example')}</Text>
							<Text fontWeight="bold" maxWidth="100%">
								{localizedDate(new Date(), editorConfig.dateFormat)}
							</Text>
						</VStack>
					)}
				</FeaturesOption>
			</FeaturesGroup>
			<FeaturesGroup title={t('editor.plainText.groupTitle')}>
				<FeaturesOption>
					<SimpleSwitch
						size="sm"
						checked={editorConfig.lineNumbers}
						onCheckedChange={(details) => {
							dispatch(
								settingsApi.setEditorConfig({
									lineNumbers: details.checked,
								}),
							);
						}}
					>
						{t('editor.plainText.lineNumbers')}
					</SimpleSwitch>
				</FeaturesOption>

				<FeaturesOption>
					<SimpleSwitch
						size="sm"
						checked={editorConfig.miniMap}
						onCheckedChange={(details) => {
							dispatch(
								settingsApi.setEditorConfig({
									miniMap: details.checked,
								}),
							);
						}}
					>
						{t('editor.plainText.miniMap')}
					</SimpleSwitch>
				</FeaturesOption>
			</FeaturesGroup>
		</>
	);
};
