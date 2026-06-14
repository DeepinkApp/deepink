import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaEraser, FaFloppyDisk } from 'react-icons/fa6';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { WorkspaceEvents } from '@api/events/workspace';
import { Box, Button, HStack, Spinner, Switch, Text, VStack } from '@chakra-ui/react';
import { BoxWithCenteredContent } from '@components/BoxWithCenteredContent';
import { TextWithIcon } from '@components/TextWithIcon';
import { NoteVersion } from '@core/features/notes/history/NoteVersions';
import { useEventBus, useNotesHistory } from '@features/App/Workspace/WorkspaceProvider';
import { useConfirmDialog } from '@hooks/useConfirmDialog';

import { NoteVersionsList } from './NoteVersionsList';

// TODO: implement lazy loading
export const NoteVersions = ({
	noteId,
	onSnapshot,
	onDeleteAll,
	onVersionApply,
	onShowVersion,
	recordControl,
	isReadOnly,
}: {
	noteId: string;
	onSnapshot: () => void;
	onDeleteAll: () => void;
	onVersionApply: (version: NoteVersion) => void;
	onShowVersion: (version: NoteVersion) => void;
	recordControl: {
		isDisabled: boolean;
		onChange: (isDisabled: boolean) => void;
	};
	isReadOnly?: boolean;
}) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);
	const noteHistory = useNotesHistory();

	const [versions, setVersions] = useState<NoteVersion[] | null>(null);
	const updateVersionsList = useCallback(
		() => noteHistory.getList(noteId).then(setVersions),
		[noteHistory, noteId],
	);

	useEffect(() => {
		setVersions(null);
		updateVersionsList();
	}, [noteId, updateVersionsList]);

	// Refresh note versions by event
	const eventBus = useEventBus();
	useEffect(() => {
		return eventBus.listen(WorkspaceEvents.NOTE_HISTORY_UPDATED, (noteId) => {
			if (noteId !== noteId) return;
			updateVersionsList();
		});
	}, [eventBus, updateVersionsList]);

	const confirm = useConfirmDialog();

	return (
		<VStack w="100%" maxH="100%">
			<HStack w="100%">
				<Button
					size="sm"
					title={t('note.versions.saveVersion.title')}
					onClick={onSnapshot}
				>
					<TextWithIcon icon={<FaFloppyDisk />}>
						{t('note.versions.saveVersion.label')}
					</TextWithIcon>
				</Button>
				<Button
					size="sm"
					title={t('note.versions.deleteAll.title')}
					onClick={(evt) => {
						if (evt.ctrlKey || evt.metaKey) {
							onDeleteAll();
						} else {
							confirm(({ onClose }) => ({
								title: t('note.versions.confirmDeleteAll.title'),
								content: (
									<Box>
										<Text>
											{t(
												'note.versions.confirmDeleteAll.description',
											)}
										</Text>
										<Text>
											{t('note.versions.confirmDeleteAll.confirm')}
										</Text>
									</Box>
								),
								action: (
									<>
										<Button
											variant="accent"
											onClick={() => {
												onDeleteAll();
												onClose();
											}}
										>
											{t('note.versions.confirmDeleteAll.action')}
										</Button>
										<Button onClick={onClose}>
											{t('common:actions.cancel')}
										</Button>
									</>
								),
							}));
						}
					}}
				>
					<TextWithIcon icon={<FaEraser />}>
						{t('note.versions.deleteAll.label')}
					</TextWithIcon>
				</Button>

				<HStack asChild>
					<label>
						<Switch.Root
							size="sm"
							checked={recordControl.isDisabled}
							onCheckedChange={(event) =>
								recordControl.onChange(event.checked)
							}
						>
							<Switch.HiddenInput />
							<Switch.Control>
								<Switch.Thumb />
							</Switch.Control>
						</Switch.Root>{' '}
						<Text>
							{
								// eslint-disable-next-line @cspell/spellchecker
								t('note.versions.dontRecord')
							}
						</Text>
					</label>
				</HStack>
			</HStack>
			<Box width="100%" overflow="auto" display="flex" flex={1} flexFlow="column">
				{versions && versions.length === 0 && (
					<BoxWithCenteredContent>
						<Text fontSize="1.3rem">{t('note.versions.empty')}</Text>
					</BoxWithCenteredContent>
				)}
				{versions === null && (
					<BoxWithCenteredContent>
						<Spinner />
					</BoxWithCenteredContent>
				)}
				{versions !== null && versions.length > 0 && (
					<NoteVersionsList
						noteId={noteId}
						versions={versions}
						onShowVersion={onShowVersion}
						onVersionApply={onVersionApply}
						isReadOnly={isReadOnly}
					/>
				)}
			</Box>
		</VStack>
	);
};
