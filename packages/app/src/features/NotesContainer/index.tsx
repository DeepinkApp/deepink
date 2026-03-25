import React, { FC, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { WorkspaceEvents } from '@api/events/workspace';
import { Box, StackProps, Text, VStack } from '@chakra-ui/react';
import { INote } from '@core/features/notes';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import {
	useEventBus,
	useNotesContext,
	useNotesHistory,
	useNotesRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { Notes } from '@features/NotesContainer/Notes';
import { OpenedNotesPanel } from '@features/NotesContainer/OpenedNotesPanel';
import { useTelemetryTracker } from '@features/telemetry';
import { useNoteActions } from '@hooks/notes/useNoteActions';
import { useUpdateNotes } from '@hooks/notes/useUpdateNotes';
import { useImmutableCallback } from '@hooks/useImmutableCallback';
import { useVaultSelector, useWorkspaceSelector } from '@state/redux/vaults/hooks';
import { selectSnapshotSettings } from '@state/redux/vaults/selectors/vault';
import { createWorkspaceSelector } from '@state/redux/vaults/utils';
import { selectActiveNoteId, selectOpenedNotes } from '@state/redux/vaults/vaults';
import { joinCallbacks } from '@utils/react/joinCallbacks';

import { EditorModePicker } from './EditorModePicker/EditorModePicker';

export type NotesContainerProps = Partial<StackProps>;

export const NotesContainer: FC<NotesContainerProps> = ({ ...props }) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);
	const telemetry = useTelemetryTracker();

	const updateNotes = useUpdateNotes();
	const noteActions = useNoteActions();

	const notesRegistry = useNotesRegistry();
	const { noteUpdated } = useNotesContext();
	const noteHistory = useNotesHistory();

	const activeNoteId = useWorkspaceSelector(selectActiveNoteId);
	const openedNotes = useWorkspaceSelector(selectOpenedNotes);

	const tabs = useWorkspaceSelector((state) =>
		createWorkspaceSelector([selectOpenedNotes], (notes) =>
			notes.map((note) => note.id),
		)(state),
	);

	const eventBus = useEventBus();
	useEffect(() => {
		return joinCallbacks(
			eventBus.listen(WorkspaceEvents.NOTES_UPDATED, updateNotes),
			eventBus.listen(WorkspaceEvents.NOTE_UPDATED, (noteId) => {
				updateNotes();
				notesRegistry.getById([noteId]).then(([note]) => {
					if (note) noteUpdated(note);
				});
			}),
		);
	}, [eventBus, noteUpdated, notesRegistry, updateNotes]);

	// Simulate note update
	const { enabled: isSnapshotsEnabled, interval: snapshotsInterval } =
		useVaultSelector(selectSnapshotSettings);
	const syncJobsRef = useRef<Record<string, NodeJS.Timeout>>({});
	const updateNote = useImmutableCallback(
		async (note: INote) => {
			noteUpdated(note);

			await notesRegistry.update(note.id, note.content);
			await notesRegistry.updateMeta([note.id], {
				isSnapshotsDisabled: note.isSnapshotsDisabled,
			});
			eventBus.emit(WorkspaceEvents.NOTE_EDITED, note.id);

			await updateNotes();

			// Reset sync job if any
			if (syncJobsRef.current[note.id]) {
				clearTimeout(syncJobsRef.current[note.id]);
				delete syncJobsRef.current[note.id];
			}

			// Sync by timeout
			if (isSnapshotsEnabled && !note.isSnapshotsDisabled) {
				syncJobsRef.current[note.id] = setTimeout(async () => {
					delete syncJobsRef.current[note.id];

					await noteHistory.snapshot(note.id);
					eventBus.emit(WorkspaceEvents.NOTE_HISTORY_UPDATED, note.id);
				}, snapshotsInterval);
			}
		},
		[
			noteUpdated,
			notesRegistry,
			eventBus,
			updateNotes,
			isSnapshotsEnabled,
			snapshotsInterval,
			noteHistory,
		],
	);

	return (
		<VStack align="start" w="100%" h="100%" gap={0} overflow="hidden" {...props}>
			{openedNotes.length > 0 ? (
				<>
					<OpenedNotesPanel
						{...{
							notes: openedNotes,
							tabs,
							activeTab: activeNoteId ?? null,
							onClose(id) {
								noteActions.close(id);
								telemetry.track(TELEMETRY_EVENT_NAME.NOTE_CLOSED, {
									context: 'top bar',
								});
							},
							onPick(id) {
								noteActions.click(id);
								telemetry.track(TELEMETRY_EVENT_NAME.NOTE_OPENED, {
									context: 'top bar',
								});
							},
							onOpenPersistently(id) {
								noteActions.click(id, { temporary: false });
							},
						}}
					/>

					<Box
						display="flex"
						flexGrow="100"
						width="100%"
						overflow="auto"
						padding=".5rem"
					>
						<Notes
							{...{
								notes: openedNotes,
								tabs,
								activeTab: activeNoteId ?? null,
								updateNote,
							}}
						/>
					</Box>

					<EditorModePicker />
				</>
			) : (
				<Box margin="auto" maxWidth="500px">
					<VStack
						fontSize="1.1rem"
						color="typography.secondary"
						gap="1rem"
						textAlign="center"
					>
						<Text variant="secondary">
							{t('notesContainer.empty.placeholder')}
						</Text>
					</VStack>
				</Box>
			)}
		</VStack>
	);
};
