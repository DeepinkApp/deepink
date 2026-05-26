import React, { useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FaCheck, FaEraser, FaFloppyDisk, FaGlasses, FaTrashCan } from 'react-icons/fa6';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { WorkspaceEvents } from '@api/events/workspace';
import { Box, Button, HStack, Switch, Text, VStack } from '@chakra-ui/react';
import { BoxWithCenteredContent } from '@components/BoxWithCenteredContent';
import { TextWithIcon } from '@components/TextWithIcon';
import { NoteVersion } from '@core/features/notes/history/NoteVersions';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { useEventBus, useNotesHistory } from '@features/App/Workspace/WorkspaceProvider';
import { useTelemetryTracker } from '@features/telemetry';
import { useConfirmDialog } from '@hooks/useConfirmDialog';

const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;
const timestampToDays = (ms: number) => Math.floor(ms / ONE_DAY_IN_MS);
const getTimestampAgeInDays = (ms: number) => timestampToDays(Date.now() - ms);

export const formatNoteVersionPreview = (version: NoteVersion) =>
	`${new Date(version.createdAt).toLocaleString()} (${version.text.length} chars)`;

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
	const telemetry = useTelemetryTracker();
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
											variant={'accent' as any}
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
			<Box w="100%" overflow="auto" display="flex" flex={1} flexFlow="column">
				{versions && versions.length === 0 && (
					<BoxWithCenteredContent>
						<Text fontSize="1.3rem">{t('note.versions.empty')}</Text>
					</BoxWithCenteredContent>
				)}
				{versions === null && (
					<BoxWithCenteredContent>
						<Text fontSize="1.3rem">{t('note.versions.loading')}</Text>
					</BoxWithCenteredContent>
				)}
				{versions !== null && versions.length > 0 && (
					<VStack w="100%" gap={0}>
						{versions.map((version) => (
							<HStack
								key={version.id}
								w="100%"
								align="start"
								padding="0.3rem"
								alignItems="center"
								_hover={{ backgroundColor: 'dim.50' }}
							>
								<HStack>
									<Text>
										{new Date(version.createdAt).toLocaleString()}
									</Text>
									<Text variant="secondary">
										{t('note.version.chars', {
											count: version.text.length,
										})}
									</Text>
								</HStack>
								<HStack marginLeft="auto">
									<Button
										disabled={Boolean(isReadOnly)}
										size="xs"
										title={
											isReadOnly
												? t('note.version.apply.readonlyTitle')
												: t('note.version.apply.title')
										}
										onClick={(evt) => {
											const applyVersion = () => {
												onVersionApply(version);
												telemetry.track(
													TELEMETRY_EVENT_NAME.NOTE_VERSION_APPLIED,
													{
														versionAgeInDays:
															getTimestampAgeInDays(
																version.createdAt,
															),
													},
												);
											};

											// Apply immediately
											if (evt.ctrlKey || evt.metaKey) {
												applyVersion();
												return;
											}

											confirm(({ onClose }) => ({
												title: t(
													'note.versions.confirmApply.title',
												),
												content: (
													<VStack gap="1rem" align="start">
														<Text>
															<Trans
																i18nKey="note.versions.confirmApply.description"
																ns={
																	LOCALE_NAMESPACE.features
																}
																values={{
																	version:
																		formatNoteVersionPreview(
																			version,
																		),
																}}
																components={{
																	secondary: (
																		<Text
																			as="span"
																			variant="secondary"
																		/>
																	),
																}}
															/>
														</Text>
														<Text>
															{t(
																'note.versions.confirmApply.warning',
															)}
														</Text>
													</VStack>
												),
												action: (
													<>
														<Button
															variant={'accent' as any}
															onClick={() => {
																applyVersion();
																onClose();
															}}
														>
															{t(
																'note.versions.confirmApply.apply',
															)}
														</Button>
														<Button
															variant={'accent' as any}
															onClick={() => {
																onShowVersion(version);
																onClose();
															}}
														>
															{t(
																'note.versions.confirmApply.preview',
															)}
														</Button>
														<Button onClick={onClose}>
															{t('common:actions.cancel')}
														</Button>
													</>
												),
											}));
										}}
									>
										<FaCheck />
									</Button>

									<Button
										size="xs"
										title={t('note.version.open.title')}
										onClick={() => {
											onShowVersion(version);

											telemetry.track(
												TELEMETRY_EVENT_NAME.NOTE_VERSION_VIEWED,
												{
													versionAgeInDays:
														getTimestampAgeInDays(
															version.createdAt,
														),
												},
											);
										}}
									>
										<FaGlasses />
									</Button>
									<Button
										size="xs"
										title={t('note.version.delete.title')}
										onClick={(evt) => {
											const deleteVersion = async () => {
												await noteHistory.delete([version.id]);
												eventBus.emit(
													WorkspaceEvents.NOTE_HISTORY_UPDATED,
													noteId,
												);

												telemetry.track(
													TELEMETRY_EVENT_NAME.NOTE_VERSION_DELETED,
													{
														versionAgeInDays:
															getTimestampAgeInDays(
																version.createdAt,
															),
													},
												);
											};

											// Delete immediately
											if (evt.ctrlKey || evt.metaKey) {
												deleteVersion();
												return;
											}

											confirm(({ onClose }) => ({
												title: t(
													'note.versions.confirmDelete.title',
												),
												content: (
													<VStack gap="1rem" align="start">
														<Text>
															<Trans
																i18nKey="note.versions.confirmDelete.description"
																ns={
																	LOCALE_NAMESPACE.features
																}
																values={{
																	version:
																		formatNoteVersionPreview(
																			version,
																		),
																}}
																components={{
																	secondary: (
																		<Text
																			as="span"
																			variant="secondary"
																		/>
																	),
																}}
															/>
														</Text>
														<Text>
															{t(
																'note.versions.confirmDelete.warning',
															)}
														</Text>
													</VStack>
												),
												action: (
													<>
														<Button
															variant={'accent' as any}
															onClick={() => {
																deleteVersion();
																onClose();
															}}
														>
															{t(
																'note.versions.confirmDelete.delete',
															)}
														</Button>
														<Button
															variant={'accent' as any}
															onClick={() => {
																onShowVersion(version);
																onClose();
															}}
														>
															{t(
																'note.versions.confirmDelete.preview',
															)}
														</Button>
														<Button onClick={onClose}>
															{t('common:actions.cancel')}
														</Button>
													</>
												),
											}));
										}}
									>
										<FaTrashCan />
									</Button>
								</HStack>
							</HStack>
						))}
					</VStack>
				)}
			</Box>
		</VStack>
	);
};
