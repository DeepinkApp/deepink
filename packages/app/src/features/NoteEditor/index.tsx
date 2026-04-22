import React, {
	FC,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
	FaArrowLeft,
	FaBoxArchive,
	FaHashtag,
	FaRegStar,
	FaStar,
	FaThumbtack,
	FaXmark,
} from 'react-icons/fa6';
import { Panel, PanelResizeHandle } from 'react-resizable-panels';
import { debounce } from 'lodash';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { WorkspaceEvents } from '@api/events/workspace';
import { Box, Button, Divider, HStack, Input, Tag, Text, VStack } from '@chakra-ui/react';
import { SuggestedTagsList } from '@components/SuggestedTagsList';
import { SyncedPanelGroup } from '@components/SyncedPanelGroup';
import { findLinksInText, getResourceIdInUrl } from '@core/features/links';
import { INote, INoteContent } from '@core/features/notes';
import { NoteMeta } from '@core/features/notes/controller';
import { NoteVersion } from '@core/features/notes/history/NoteVersions';
import { IResolvedTag } from '@core/features/tags';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import {
	useAttachmentsController,
	useEventBus,
	useNotesHistory,
	useNotesRegistry,
	useTagsRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { useTelemetryTracker } from '@features/telemetry';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useCommand } from '@hooks/commands/useCommand';
import { useWorkspaceCommandCallback } from '@hooks/commands/useWorkspaceCommandCallback';
import { useAppDispatch } from '@state/redux/hooks';
import {
	useVaultSelector,
	useWorkspaceActions,
	useWorkspaceData,
	useWorkspaceSelector,
} from '@state/redux/vaults/hooks';
import { selectSnapshotSettings } from '@state/redux/vaults/selectors/vault';
import { selectTags, workspacesApi } from '@state/redux/vaults/vaults';

import { NoteEditor } from './NoteEditor';
import { NoteMenu } from './NoteMenu';
import { NoteSidebar } from './NoteSidebar';
import { NoteVersions } from './NoteVersions';

export enum NoteSidebarTabs {
	HISTORY = 'HISTORY',
	BACK_LINKS = 'BACK_LINKS',
}

export type NoteEditorProps = {
	note: INote;
	updateNote: (note: INoteContent) => void;
	updateMeta: (meta: Partial<NoteMeta>) => void;
	isActive?: boolean;
};

/**
 * TODO: rename directory of component
 * TODO: create note context to interact with note from deep components
 */
export const Note: FC<NoteEditorProps> = memo(
	({ note, updateNote, updateMeta, isActive }) => {
		const { t } = useTranslation(LOCALE_NAMESPACE.features);
		const telemetry = useTelemetryTracker();
		const dispatch = useAppDispatch();
		const workspaceData = useWorkspaceData();
		const workspaceAction = useWorkspaceActions();

		const eventBus = useEventBus();
		const notesRegistry = useNotesRegistry();

		const runCommand = useCommand();

		const [title, setTitle] = useState(note.content.title);
		const [text, setText] = useState(note.content.text);

		// Forced update for note data
		const forceUpdateLocalStateRef = useRef(false);
		useMemo(() => {
			if (!forceUpdateLocalStateRef.current) return;
			forceUpdateLocalStateRef.current = false;

			setTitle(note.content.title);
			setText(note.content.text);
		}, [note]);

		const tagsRegistry = useTagsRegistry();

		const tags = useWorkspaceSelector(selectTags);

		const [notAttachedTags, setNotAttachedTags] = useState<IResolvedTag[]>([]);
		const [attachedTags, setAttachedTags] = useState<IResolvedTag[]>([]);
		const updateTags = useCallback(async () => {
			const attachedTags = await tagsRegistry.getAttachedTags(note.id);
			setAttachedTags(attachedTags);

			const filteredAttachedTags = tags.filter(
				({ id }) => !attachedTags.some((attachedTag) => attachedTag.id === id),
			);
			setNotAttachedTags(filteredAttachedTags);
		}, [note.id, tags, tagsRegistry]);
		useEffect(() => {
			updateTags();
		}, [note.id, tagsRegistry, updateTags]);

		const updateNoteRef = useRef(updateNote);
		updateNoteRef.current = updateNote;

		// Snapshot note once
		const noteSnapshotPromiseRef = useRef<null | Promise<void>>(null);
		const noteHistory = useNotesHistory();
		const { enabled: isSnapshotsEnabled } = useVaultSelector(selectSnapshotSettings);
		useEffect(() => {
			if (!isSnapshotsEnabled || note.isSnapshotsDisabled) return;

			noteSnapshotPromiseRef.current = new Promise<void>(async (res) => {
				for (let attempt = 0; attempt < 3; attempt++) {
					try {
						await noteHistory.snapshot(note.id);
						res();
						return;
					} catch (err) {
						// Retry after delay
						console.error(err);
						await new Promise((res) => setTimeout(res, 200));
					}
				}
			}).then(() => {
				noteSnapshotPromiseRef.current = null;
			});

			// We need to run this effect once, at first render only
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, []);

		// eslint-disable-next-line react-hooks/exhaustive-deps
		const debouncedUpdateNote = useCallback(
			debounce((data: { title: string; text: string }) => {
				console.debug('Update note in DB');
				updateNoteRef.current(data);
			}, 800),
			[],
		);

		const isFirstRenderRef = useRef(true);
		useEffect(() => {
			if (isFirstRenderRef.current) {
				isFirstRenderRef.current = false;
				return;
			}

			if (noteSnapshotPromiseRef.current === null) {
				debouncedUpdateNote({ title, text });
			} else {
				// Wait note snapshotting before call
				noteSnapshotPromiseRef.current.then(() => {
					debouncedUpdateNote({ title, text });
				});
			}
		}, [title, text, debouncedUpdateNote]);

		// Immediately update a temporary note to permanent if content has changed
		const isFirstRunRef = useRef(true);
		useEffect(() => {
			if (isFirstRunRef.current) {
				isFirstRunRef.current = false;
				return;
			}

			dispatch(workspaceAction.markNoteAsPermanent({ noteId: note.id }));
		}, [title, text, dispatch, workspaceAction, note.id]);

		const attachments = useAttachmentsController();

		// TODO: throttle calls and run in IDLE
		const noteId = note.id;
		const updateAttachments = useCallback(
			(text: string) => {
				// Find ids
				const filesIdRaw = findLinksInText(text).map((link) =>
					getResourceIdInUrl(link.url),
				);

				// Collect unique IDs
				const filesId: string[] = [];
				for (const fileId of filesIdRaw) {
					if (fileId === null) continue;
					if (filesId.includes(fileId)) continue;
					filesId.push(fileId);
				}

				attachments.set(noteId, filesId);
			},
			[attachments, noteId],
		);

		useEffect(() => {
			updateAttachments(text);
		}, [text, updateAttachments]);

		const [attachTagName, setAttachTagName] = useState<IResolvedTag | null>(null);
		const [tagSearch, setTagSearch] = useState(
			attachTagName ? attachTagName.resolvedName : '',
		);

		const [sidePanel, setSidePanel] = useState<NoteSidebarTabs | null>(null);
		useEffect(() => {
			if (sidePanel) {
				telemetry.track(TELEMETRY_EVENT_NAME.NOTE_SIDE_PANEL_SHOWN, {
					tab: sidePanel,
				});
			}
		}, [sidePanel, telemetry]);

		useWorkspaceCommandCallback(
			GLOBAL_COMMANDS.TOGGLE_NOTE_HISTORY_PANEL,
			() => {
				setSidePanel((state) =>
					state === NoteSidebarTabs.HISTORY ? null : NoteSidebarTabs.HISTORY,
				);
			},
			{ enabled: isActive },
		);

		const [versionPreview, setVersionPreview] = useState<NoteVersion | null>(null);

		const isReadOnly = note.isDeleted || Boolean(versionPreview);

		return (
			<VStack w="100%" align="start">
				<HStack w="100%" align="start">
					<HStack w="100%" align="start">
						<Input
							placeholder={t('note.title.placeholder')}
							variant="flushed"
							size="sm"
							fontSize="22px"
							value={versionPreview ? versionPreview.title : title}
							onChange={
								versionPreview
									? undefined
									: (evt) => setTitle(evt.target.value)
							}
							isDisabled={isReadOnly}
						/>

						{/* TODO: add options that may be toggled */}
						<NoteMenu note={note} />
					</HStack>
				</HStack>

				<HStack alignItems="center" w="100%" flexWrap="wrap">
					<HStack gap=".3rem">
						<Button
							variant="ghost"
							title={
								note.isBookmarked
									? t('note.actions.removeFromFavorites')
									: t('note.actions.addToFavorites')
							}
							size="xs"
							onClick={() =>
								runCommand(GLOBAL_COMMANDS.TOGGLE_NOTE_BOOKMARK, {
									noteId: note.id,
								})
							}
							isActive={note.isBookmarked}
						>
							<Box
								as={note.isBookmarked ? FaStar : FaRegStar}
								transform="scale(1.2)"
							/>
						</Button>
						<Button
							variant="ghost"
							title={
								note.isArchived
									? t('note.actions.removeFromArchive')
									: t('note.actions.moveToArchive')
							}
							size="xs"
							onClick={() =>
								runCommand(GLOBAL_COMMANDS.TOGGLE_NOTE_ARCHIVE, {
									noteId: note.id,
								})
							}
							isActive={note.isArchived}
						>
							<Box as={FaBoxArchive} transform="scale(1.1)" />
						</Button>
						<Button variant="ghost" size="xs">
							<Box as={FaThumbtack} transform="scale(1.1)" />
						</Button>
					</HStack>

					<Divider orientation="vertical" h="1em" />

					{attachedTags.map((tag) => (
						<Tag
							as={HStack}
							key={tag.id}
							height="fit-content"
							gap=".4rem"
							onClick={() => {
								dispatch(
									workspacesApi.setSelectedTag({
										...workspaceData,
										tag: tag.id,
									}),
								);
							}}
							sx={{ cursor: 'pointer' }}
						>
							<HStack gap=".2rem">
								<FaHashtag />
								<Text>{tag.resolvedName}</Text>
							</HStack>

							<Box
								sx={{
									'&:not(:hover)': {
										opacity: '.6',
									},
								}}
							>
								<FaXmark
									onClick={async (evt) => {
										evt.stopPropagation();
										console.warn(
											'Remove attached tag',
											tag.resolvedName,
										);

										const updatedTags = attachedTags
											.filter(({ id }) => id !== tag.id)
											.map(({ id }) => id);
										await tagsRegistry.setAttachedTags(
											noteId,
											updatedTags,
										);
										await updateTags();

										telemetry.track(
											TELEMETRY_EVENT_NAME.NOTE_TAG_DETACHED,
											{
												count: Math.max(
													0,
													attachedTags.length - 1,
												),
											},
										);
									}}
								/>
							</Box>
						</Tag>
					))}

					<SuggestedTagsList
						tags={notAttachedTags}
						selectedTag={attachTagName ?? undefined}
						inputValue={tagSearch}
						onInputChange={setTagSearch}
						sx={{
							display: 'inline',
							w: 'auto',
							maxW: '150px',
						}}
						inputProps={{
							placeholder: t('note.tags.addPlaceholder'),
							// size: 'sm',
							size: 'xs',
							variant: 'flushed',
						}}
						hasTagName={(tagName) =>
							tags.some(({ resolvedName }) => resolvedName === tagName)
						}
						onPick={async (tag) => {
							setAttachTagName(tag);
							await tagsRegistry.setAttachedTags(noteId, [
								...attachedTags.map(({ id }) => id),
								tag.id,
							]);
							telemetry.track(TELEMETRY_EVENT_NAME.NOTE_TAG_ATTACHED, {
								tagsCount: attachedTags.length + 1,
								context: 'tags suggest list',
							});

							setTagSearch('');

							await updateTags();
						}}
						onCreateTag={async (tagName) => {
							setAttachTagName(null);

							let shortenedTagName = tagName;
							let parentTagId: string | null = null;
							const tagSegments = tagName.split('/');
							for (
								let lastSegmentIndex = tagSegments.length - 1;
								lastSegmentIndex > 0;
								lastSegmentIndex--
							) {
								const resolvedParentTag = tagSegments
									.slice(0, lastSegmentIndex)
									.join('/');
								const foundTag = tags.find(
									({ resolvedName }) =>
										resolvedName === resolvedParentTag,
								);
								if (foundTag) {
									parentTagId = foundTag.id;
									shortenedTagName = tagSegments
										.slice(lastSegmentIndex)
										.join('/');
									break;
								}
							}

							const tagId = await tagsRegistry.add(
								shortenedTagName,
								parentTagId,
							);
							telemetry.track(TELEMETRY_EVENT_NAME.TAG_CREATED, {
								scope: 'note editor',
								hasParent: parentTagId === null ? 'no' : 'yes',
							});

							await tagsRegistry.setAttachedTags(noteId, [
								...attachedTags.map(({ id }) => id),
								tagId,
							]);
							telemetry.track(TELEMETRY_EVENT_NAME.NOTE_TAG_ATTACHED, {
								tagsCount: attachedTags.length + 1,
								context: 'create tag option',
							});

							await updateTags();
						}}
					/>
				</HStack>

				{versionPreview && (
					<HStack alignItems="center" w="100%" flexWrap="wrap">
						<HStack gap=".3rem">
							<Button
								variant="ghost"
								size="xs"
								title={t('note.versionPreview.backToEditing')}
								onClick={() => {
									setVersionPreview(null);
								}}
							>
								<FaArrowLeft />
							</Button>

							<Text color="typography.secondary">
								{t('note.versionPreview.versionAt', {
									date: new Date(
										versionPreview.createdAt,
									).toLocaleString(),
								})}
							</Text>
						</HStack>
					</HStack>
				)}

				<SyncedPanelGroup
					direction="vertical"
					autoSaveId="MainScreen.noteContent"
				>
					<Box
						as={Panel}
						defaultSize={80}
						minH="min(200px, 100%)"
						display="flex"
						flexDirection="column"
					>
						<NoteEditor
							text={versionPreview ? versionPreview.text : text}
							setText={(noteText) => {
								if (isReadOnly) return;
								setText(noteText);
							}}
							isReadOnly={isReadOnly}
							isActive={isActive}
						/>
					</Box>

					{!sidePanel ? null : (
						<>
							<Box as={PanelResizeHandle} color="surface.border" />
							<Box as={Panel} defaultSize={30} minH="200px">
								<NoteSidebar
									onClose={() => setSidePanel(null)}
									activeTab={sidePanel as string}
									onActiveTabChanged={(id) =>
										setSidePanel(id as NoteSidebarTabs)
									}
									tabs={[
										{
											id: NoteSidebarTabs.HISTORY,
											title: t('note.sidebar.tabs.history'),
											content() {
												return (
													<NoteVersions
														isReadOnly={isReadOnly}
														noteId={note.id}
														recordControl={{
															isDisabled: Boolean(
																note.isSnapshotsDisabled,
															),
															onChange(isDisabled) {
																updateMeta({
																	isSnapshotsDisabled:
																		isDisabled,
																});
															},
														}}
														onShowVersion={(version) =>
															setVersionPreview(version)
														}
														onVersionApply={async (
															version,
														) => {
															await noteHistory.snapshot(
																note.id,
															);
															await notesRegistry.update(
																note.id,
																version,
															);
															await noteHistory.snapshot(
																note.id,
															);

															eventBus.emit(
																WorkspaceEvents.NOTE_HISTORY_UPDATED,
																note.id,
															);
															eventBus.emit(
																WorkspaceEvents.NOTE_UPDATED,
																note.id,
															);
															forceUpdateLocalStateRef.current = true;
														}}
														onSnapshot={async () => {
															await noteHistory.snapshot(
																note.id,
																{
																	force: true,
																},
															);
															eventBus.emit(
																WorkspaceEvents.NOTE_HISTORY_UPDATED,
																note.id,
															);
														}}
														onDeleteAll={async () => {
															await noteHistory.purge([
																note.id,
															]);
															eventBus.emit(
																WorkspaceEvents.NOTE_HISTORY_UPDATED,
																note.id,
															);
														}}
													/>
												);
											},
										},
										{
											id: NoteSidebarTabs.BACK_LINKS,
											title: t('note.sidebar.tabs.backLinks'),
											content() {
												return <div>TODO: Note back links</div>;
											},
										},
										{
											id: 'files',
											title: t('note.sidebar.tabs.files'),
											content() {
												return (
													<div>
														TODO: Files attached to note
													</div>
												);
											},
										},
									]}
								/>
							</Box>
						</>
					)}
				</SyncedPanelGroup>
			</VStack>
		);
	},
);

Note.displayName = 'Note';
