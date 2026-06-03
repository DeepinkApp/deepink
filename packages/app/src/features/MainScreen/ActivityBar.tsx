import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFeather, FaInbox, FaRegClock, FaRegFolder } from 'react-icons/fa6';
import { GrSettingsOption } from 'react-icons/gr';
import { IoCloudUploadOutline, IoExtensionPuzzleOutline } from 'react-icons/io5';
import { MdLockOutline } from 'react-icons/md';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { useDebouncedCallback } from 'use-debounce';
import { ButtonGroup, VStack } from '@chakra-ui/react';
import { IconButton } from '@components/IconButton';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { useVaultControls } from '@features/App/Vault';
import { useTelemetryTracker } from '@features/telemetry';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useCommand } from '@hooks/commands/useCommand';
import { useCreateNote } from '@hooks/notes/useCreateNote';

export const ActivityBar = memo(() => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);
	const telemetry = useTelemetryTracker();

	const vaultControls = useVaultControls();

	const command = useCommand();

	const createNote = useCreateNote();
	const debouncedCreateNote = useDebouncedCallback(async () => {
		await createNote();

		telemetry.track(TELEMETRY_EVENT_NAME.NOTE_CREATED, {
			context: 'button "new note"',
		});
	}, 30);

	return (
		<VStack
			css={{
				alignItems: 'start',
				minHeight: '100%',
				padding: '.5rem',
				overflow: 'hidden',

				'& & button': {
					padding: 0,
					'& svg': {
						boxSize: '50%',
					},
				},
			}}
		>
			<ButtonGroup orientation="vertical" size="sm" variant="ghost">
				<IconButton
					icon={<FaFeather />}
					tooltipPlacement="right"
					title={t('activityBar.newNote')}
					variant="accent"
					onClick={debouncedCreateNote}
				/>

				<IconButton
					icon={<FaRegFolder />}
					tooltipPlacement="right"
					title={t('activityBar.files')}
				/>

				<IconButton
					icon={<FaRegClock />}
					tooltipPlacement="right"
					title={t('activityBar.reminders')}
				/>
				<IconButton
					icon={<IoExtensionPuzzleOutline style={{ scale: 1.3 }} />}
					tooltipPlacement="right"
					title={t('activityBar.extensions')}
				/>

				<IconButton
					icon={<FaInbox />}
					tooltipPlacement="right"
					title={t('activityBar.inbox')}
				/>

				<IconButton
					icon={<IoCloudUploadOutline />}
					tooltipPlacement="right"
					title={t('activityBar.publishNotes')}
				/>
			</ButtonGroup>
			<ButtonGroup
				marginTop="auto"
				orientation="vertical"
				size="sm"
				variant="ghost"
			>
				{vaultControls.vault.vault.isEncrypted && (
					// Only encrypted vaults can be locked
					<IconButton
						icon={<MdLockOutline style={{ scale: 1.3 }} />}
						title={t('activityBar.lockVault')}
						tooltipPlacement="right"
						onClick={() => vaultControls.close()}
					/>
				)}
				<IconButton
					icon={<GrSettingsOption style={{ scale: 1.2 }} />}
					title={t('activityBar.globalSettings')}
					tooltipPlacement="right"
					onClick={() => {
						command(GLOBAL_COMMANDS.OPEN_GLOBAL_SETTINGS);

						telemetry.track(TELEMETRY_EVENT_NAME.SETTINGS_CLICK, {
							scope: 'global settings',
						});
					}}
				/>
			</ButtonGroup>
		</VStack>
	);
});

ActivityBar.displayName = 'ActivityBar';
