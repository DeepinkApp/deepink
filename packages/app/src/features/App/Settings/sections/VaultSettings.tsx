import React from 'react';
import { useTranslation } from 'react-i18next';
import humanizeDuration from 'humanize-duration';
import ms from 'ms';
import { LOCALE_NAMESPACE } from 'src/i18n';
import z from 'zod';
import {
	Button,
	Input,
	InputGroup,
	NativeSelect,
	Separator,
	Text,
} from '@chakra-ui/react';
import { Features } from '@components/Features/Features';
import { FeaturesGroup } from '@components/Features/Group';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';
import { RelaxedInput } from '@components/RelaxedInput';
import { SimpleSwitch } from '@components/SimpleSwitch';
import { RelaxedSlider } from '@components/Slider/RelaxedSlider';
import { useAppDispatch } from '@state/redux/hooks';
import { useVaultActions, useVaultSelector } from '@state/redux/vaults/hooks';
import {
	selectDeletionConfig,
	selectIntegrityServiceConfig,
	selectSnapshotSettings,
} from '@state/redux/vaults/selectors/vault';
import { defaultVaultConfig } from '@state/redux/vaults/vaults';

export const VaultSettings = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.settings);
	const dispatch = useAppDispatch();
	const vaultActions = useVaultActions();

	const snapshotsConfig = useVaultSelector(selectSnapshotSettings);
	const deletionConfig = useVaultSelector(selectDeletionConfig);
	const filesIntegrityConfig = useVaultSelector(selectIntegrityServiceConfig);

	return (
		<Features>
			<FeaturesGroup>
				<FeaturesOption title={t('vault.name.title')}>
					<Input defaultValue="Personal notes" size="sm" />
				</FeaturesOption>

				<FeaturesOption description={t('vault.rememberPasswords.description')}>
					<SimpleSwitch size="sm">
						{t('vault.rememberPasswords.label')}
					</SimpleSwitch>
				</FeaturesOption>
			</FeaturesGroup>
			<FeaturesGroup title={t('vault.filesAndData.groupTitle')}>
				<FeaturesOption title={t('vault.filesAndData.imagesCompression.title')}>
					<NativeSelect.Root size="sm" width="auto">
						<NativeSelect.Field defaultValue="ask">
							<option value="compress">
								{t('vault.filesAndData.imagesCompression.compress')}
							</option>
							<option value="no-compress">
								{t('vault.filesAndData.imagesCompression.doNotCompress')}
							</option>
							<option value="ask">
								{t('vault.filesAndData.imagesCompression.alwaysAsk')}
							</option>
						</NativeSelect.Field>
						<NativeSelect.Indicator />
					</NativeSelect.Root>
				</FeaturesOption>

				<FeaturesOption
					description={t('vault.filesAndData.deleteOrphaned.description')}
				>
					<SimpleSwitch
						size="sm"
						checked={filesIntegrityConfig.enabled}
						onCheckedChange={(details) => {
							dispatch(
								vaultActions.setFilesIntegrityConfig({
									enabled: details.checked,
								}),
							);
						}}
					>
						{t('vault.filesAndData.deleteOrphaned.label')}
					</SimpleSwitch>
				</FeaturesOption>
			</FeaturesGroup>
			<FeaturesGroup title={t('vault.encryption.groupTitle')}>
				<FeaturesOption title={t('vault.encryption.algorithm.title')}>
					<NativeSelect.Root size="sm" width="auto">
						<NativeSelect.Field defaultValue="aes">
							{[
								{
									value: 'none',
									text: t('vault.encryption.algorithm.none'),
								},
								{
									value: 'aes',
									text: 'AES',
								},
								{
									value: 'twofish',
									text: 'Twofish',
								},
							].map(({ value, text }) => (
								<option key={value} value={value}>
									{text}
								</option>
							))}
						</NativeSelect.Field>
						<NativeSelect.Indicator />
					</NativeSelect.Root>
				</FeaturesOption>

				<FeaturesOption title={t('vault.encryption.password.title')}>
					<Button size="sm">{t('vault.encryption.password.update')}</Button>
				</FeaturesOption>
			</FeaturesGroup>
			<FeaturesGroup title={t('vault.synchronization.groupTitle')}>
				<FeaturesOption
					description={t('vault.synchronization.enable.description')}
				>
					<SimpleSwitch size="sm">
						{t('vault.synchronization.enable.label')}
					</SimpleSwitch>
				</FeaturesOption>
				<FeaturesOption title={t('vault.synchronization.method.title')}>
					<NativeSelect.Root size="sm" width="auto">
						<NativeSelect.Field defaultValue="fs">
							{[
								{
									value: 'fs',
									text: t('vault.synchronization.method.fileSystem'),
								},
								{
									value: 'server',
									text: t('vault.synchronization.method.server'),
								},
							].map(({ value, text }) => (
								<option key={value} value={value}>
									{text}
								</option>
							))}
						</NativeSelect.Field>
						<NativeSelect.Indicator />
					</NativeSelect.Root>
				</FeaturesOption>
				<FeaturesOption title={t('vault.synchronization.directory.title')}>
					<Input
						size="sm"
						placeholder={t('vault.synchronization.directory.placeholder')}
						defaultValue="/foo/bar"
						disabled
					/>
				</FeaturesOption>
			</FeaturesGroup>
			<FeaturesGroup title={t('vault.snapshots.groupTitle')}>
				<FeaturesOption description={t('vault.snapshots.record.description')}>
					<SimpleSwitch
						size="sm"
						checked={snapshotsConfig.enabled}
						onCheckedChange={(details) => {
							dispatch(
								vaultActions.setSnapshotsConfig({
									enabled: details.checked,
								}),
							);
						}}
					>
						{t('vault.snapshots.record.label')}
					</SimpleSwitch>
				</FeaturesOption>

				<FeaturesOption
					title={t('vault.snapshots.delay.title')}
					description={t('vault.snapshots.delay.description')}
				>
					<RelaxedSlider
						min={ms('10s')}
						max={ms('5m')}
						step={ms('10s')}
						resetValue={defaultVaultConfig.snapshots.interval}
						transformValue={(value) =>
							humanizeDuration(value, { units: ['m', 's'] })
						}
						value={snapshotsConfig.interval}
						onChange={(value) => {
							dispatch(
								vaultActions.setSnapshotsConfig({
									interval: value,
								}),
							);
						}}
					/>
				</FeaturesOption>
			</FeaturesGroup>
			<FeaturesGroup title={t('vault.trashBin.groupTitle')}>
				<FeaturesOption
					description={t('vault.trashBin.confirmDeletion.description')}
				>
					<SimpleSwitch
						size="sm"
						checked={deletionConfig.confirm}
						onCheckedChange={(details) => {
							dispatch(
								vaultActions.setNoteDeletionConfig({
									confirm: details.checked,
								}),
							);
						}}
					>
						{t('vault.trashBin.confirmDeletion.label')}
					</SimpleSwitch>
				</FeaturesOption>

				<FeaturesOption description={t('vault.trashBin.moveToBin.description')}>
					<SimpleSwitch
						size="sm"
						checked={!deletionConfig.permanentDeletion}
						onCheckedChange={(details) => {
							dispatch(
								vaultActions.setNoteDeletionConfig({
									permanentDeletion: !details.checked,
								}),
							);
						}}
					>
						{t('vault.trashBin.moveToBin.label')}
					</SimpleSwitch>
				</FeaturesOption>

				<Separator />

				<FeaturesOption description={t('vault.trashBin.autoPurge.description')}>
					<SimpleSwitch
						size="sm"
						checked={deletionConfig.bin.autoClean}
						onCheckedChange={(details) => {
							dispatch(
								vaultActions.setBinAutoDeletionConfig({
									autoClean: details.checked,
								}),
							);
						}}
					>
						{t('vault.trashBin.autoPurge.label')}
					</SimpleSwitch>
				</FeaturesOption>

				<FeaturesOption
					title={t('vault.trashBin.purgeDelay.title')}
					description={t('vault.trashBin.purgeDelay.description')}
				>
					<InputGroup
						width="auto"
						endElement={
							<Text variant="secondary" pointerEvents="none" width="3rem">
								{t('vault.trashBin.purgeDelay.unit')}
							</Text>
						}
					>
						<RelaxedInput
							width="8rem"
							textAlign="right"
							type="number"
							min={1}
							max={1000}
							css={{ paddingInlineEnd: '3rem' }}
							value={deletionConfig.bin.cleanInterval}
							onValueChange={(value) => {
								const result = z.coerce.number().min(1).safeParse(value);
								const days = result.data ?? 30;

								dispatch(
									vaultActions.setBinAutoDeletionConfig({
										cleanInterval: days,
									}),
								);
							}}
						/>
					</InputGroup>
				</FeaturesOption>
			</FeaturesGroup>
		</Features>
	);
};
