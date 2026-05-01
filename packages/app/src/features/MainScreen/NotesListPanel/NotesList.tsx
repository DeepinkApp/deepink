import React, { FC, useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FaPenToSquare } from 'react-icons/fa6';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Box, Button, Skeleton, Text, VStack } from '@chakra-ui/react';
import { NotePreview } from '@components/NotePreview/NotePreview';
import { getNoteTitle } from '@core/features/notes/utils';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { getContextMenuCoords } from '@electron/requests/contextMenu/renderer';
import { useNoteContextMenu } from '@features/NotesContainer/NoteContextMenu/useNoteContextMenu';
import { useTelemetryTracker } from '@features/telemetry';
import { useCreateNote } from '@hooks/notes/useCreateNote';
import { useNoteActions } from '@hooks/notes/useNoteActions';
import { useIsActiveWorkspace } from '@hooks/useIsActiveWorkspace';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceActions, useWorkspaceSelector } from '@state/redux/vaults/hooks';
import {
	selectActiveNoteId,
	selectNoteIds,
	selectSearch,
} from '@state/redux/vaults/vaults';
import { ScrollToOptions, useVirtualizer } from '@tanstack/react-virtual';

import { useLocalizedDate } from '../../../hooks/useLocalizedDate';

import { useNotesData } from './useNotesData';
import { useScrollToActiveNote } from './useScrollToActiveNote';

export const scrollAlignment: ScrollToOptions['align'] = 'start';

export type NotesListProps = {};

export const NotesList: FC<NotesListProps> = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);
	const localizedDate = useLocalizedDate();
	const telemetry = useTelemetryTracker();
	const workspaceActions = useWorkspaceActions();
	const dispatch = useAppDispatch();

	const createNote = useCreateNote();

	const noteActions = useNoteActions();

	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);
	const noteIds = useWorkspaceSelector(selectNoteIds);

	const search = useWorkspaceSelector(selectSearch);

	const openNoteContextMenu = useNoteContextMenu();

	const parentRef = useRef<HTMLDivElement>(null);
	const isActiveWorkspace = useIsActiveWorkspace();

	// eslint-disable-next-line react-hooks/incompatible-library
	const virtualizer = useVirtualizer({
		enabled: isActiveWorkspace,
		count: noteIds.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 180,
		overscan: 5,
		useFlushSync: false,
	});

	const virtualNoteItems = virtualizer.getVirtualItems();

	const notesData = useNotesData({
		noteIds: virtualNoteItems.map((i) => noteIds[i.index]),
	});

	// TODO: add command to scroll a list to note id. Call this command by click note tab
	// Scroll to active note
	const activeNoteRef = useRef<HTMLDivElement | null>(null);
	useScrollToActiveNote({
		virtualizer,
		noteIds,
		activeNoteId,
		activeNoteRef,
	});

	// TODO: implement dragging and moving items
	return (
		<VStack
			ref={parentRef}
			sx={{
				w: '100%',
				h: '100%',
				overflow: 'auto',
				align: 'center',
				userSelect: 'none',
				paddingInlineEnd: '.3rem',
			}}
		>
			{noteIds.length === 0 ? (
				<Text
					pos="relative"
					top="40%"
					paddingInline="1rem"
					textAlign="center"
					whiteSpace="pre-line"
					lineHeight="1.6rem"
				>
					<Trans
						t={t}
						i18nKey="notesList.empty"
						components={{
							create: (
								<Button
									onClick={async () => {
										await createNote();

										telemetry.track(
											TELEMETRY_EVENT_NAME.NOTE_CREATED,
											{
												context: 'empty notes list tip',
											},
										);
									}}
									size="sm"
									variant="link"
									leftIcon={<FaPenToSquare />}
									iconSpacing=".2rem"
								></Button>
							),
						}}
					/>
				</Text>
			) : (
				<Box
					sx={{
						display: 'block',
						position: 'relative',
						width: '100%',
						height: virtualizer.getTotalSize(),
						flexShrink: 0,
					}}
				>
					<VStack
						sx={{
							width: '100%',
							top: 0,
							left: 0,
							marginTop: `${virtualNoteItems[0]?.start ?? 0}px`,
							gap: '4px',
						}}
					>
						{virtualNoteItems.map((virtualRow) => {
							const id = noteIds[virtualRow.index];
							const isActive = id === activeNoteId;

							const note = notesData.get(id);
							if (!note)
								return (
									<Skeleton
										key={id}
										ref={isActive ? activeNoteRef : undefined}
										data-index={virtualRow.index}
										data-loading
										startColor="primary.100"
										endColor="dim.400"
										height="70px"
										w="100%"
									/>
								);

							const date = note.updatedTimestamp ?? note.createdTimestamp;

							// TODO: get preview text from DB as prepared value
							// TODO: show attachments
							return (
								<NotePreview
									key={note.id}
									ref={(node) => {
										if (isActive) {
											activeNoteRef.current = node;
										}

										virtualizer.measureElement(node);
									}}
									data-index={virtualRow.index}
									isSelected={isActive}
									textToHighlight={search}
									title={getNoteTitle(note.content)}
									text={note.content.text}
									meta={
										date && (
											<Text>{localizedDate(new Date(date))}</Text>
										)
									}
									onContextMenu={(evt) => {
										openNoteContextMenu(
											note,
											getContextMenuCoords(evt.nativeEvent),
										);
									}}
									onClick={() => {
										// Open note temporarily
										noteActions.click(note.id);
										telemetry.track(
											TELEMETRY_EVENT_NAME.NOTE_OPENED,
											{
												context: 'notes list',
											},
										);
									}}
									onDoubleClick={() => {
										// Update note state to non-temporary
										dispatch(
											workspaceActions.setNoteTemporaryState({
												noteId: note.id,
												isTemporary: false,
											}),
										);
									}}
								/>
							);
						})}
					</VStack>
				</Box>
			)}
		</VStack>
	);
};
