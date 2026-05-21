import { useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { WorkspaceEvents } from '@api/events/workspace';
import { formatNoteLink } from '@core/features/links';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import {
	useEventBus,
	useNotesRegistry,
	useTagsRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { useTelemetryTracker } from '@features/telemetry';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useWorkspaceCommandCallback } from '@hooks/commands/useWorkspaceCommandCallback';
import { getNoteContentPreview } from '@hooks/notes/getNoteContentPreview';
import { useNoteActions } from '@hooks/notes/useNoteActions';
import { useAppSelector } from '@state/redux/hooks';
import { useVaultSelector, useWorkspaceData } from '@state/redux/vaults/hooks';
import { selectDeletionConfig } from '@state/redux/vaults/selectors/vault';
import { selectWorkspace } from '@state/redux/vaults/vaults';
import { copyTextToClipboard } from '@utils/clipboard';

import { buildFileName, configureNoteNameGetter, useNotesExport } from './useNotesExport';

/**
 * Registers handlers for commands that operate on a specific note
 */
export const useNoteCommandHandlers = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);
	const telemetry = useTelemetryTracker();
	const notes = useNotesRegistry();
	const tagsRegistry = useTagsRegistry();

	const noteActions = useNoteActions();

	const notesExport = useNotesExport();
	const currentWorkspace = useWorkspaceData();
	const workspaceData = useAppSelector(selectWorkspace(currentWorkspace));

	const deletionConfig = useVaultSelector(selectDeletionConfig);

	const eventBus = useEventBus();

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.MOVE_NOTE_TO_BIN, async ({ noteId }) => {
		await noteActions.close(noteId);

		await notes.updateMeta([noteId], { isDeleted: true });
		eventBus.emit(WorkspaceEvents.NOTE_UPDATED, { noteId });

		telemetry.track(TELEMETRY_EVENT_NAME.NOTE_DELETED, {
			permanently: 'false',
		});
	});

	useWorkspaceCommandCallback(
		GLOBAL_COMMANDS.DELETE_NOTE_PERMANENTLY,
		async ({ noteId }) => {
			if (
				deletionConfig.confirm &&
				!confirm(t('note.bin.confirmPermanentDeletion'))
			)
				return;

			await noteActions.close(noteId);

			await notes.delete([noteId]);
			await tagsRegistry.setAttachedTags(noteId, []);

			eventBus.emit(WorkspaceEvents.NOTES_UPDATED);

			telemetry.track(TELEMETRY_EVENT_NAME.NOTE_DELETED, {
				permanently: 'true',
			});
		},
	);

	useWorkspaceCommandCallback(
		GLOBAL_COMMANDS.RESTORE_NOTE_FROM_BIN,
		async ({ noteId }) => {
			// only deleted note can be restored
			const [note] = await notes.getById([noteId]);
			if (!note || !note.isDeleted) return;

			await notes.updateMeta([noteId], { isDeleted: false });
			eventBus.emit(WorkspaceEvents.NOTE_UPDATED, { noteId });

			telemetry.track(TELEMETRY_EVENT_NAME.NOTE_RESTORED_FROM_BIN);
		},
	);

	const getName = configureNoteNameGetter(true);
	useWorkspaceCommandCallback(GLOBAL_COMMANDS.EXPORT_NOTE, async ({ noteId }) => {
		const [note] = await notes.getById([noteId]);
		if (!note) return;

		const tags = await tagsRegistry.getAttachedTags(noteId);

		await notesExport.exportNote(
			noteId,
			buildFileName(
				workspaceData?.name,
				getName({ ...note, tags: tags.map((t) => t.resolvedName) }),
			),
		);
	});

	useWorkspaceCommandCallback(
		GLOBAL_COMMANDS.COPY_NOTE_MARKDOWN_LINK,
		async ({ noteId }) => {
			const [note] = await notes.getById([noteId]);
			if (!note) {
				console.error(`Can't get data of note #${noteId}`);
				return;
			}

			await copyTextToClipboard(
				`[${getNoteContentPreview(note.content) || t('note.title.placeholder')}](${formatNoteLink(noteId)})`,
			);
		},
	);

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.DUPLICATE_NOTE, async ({ noteId }) => {
		const [sourceNote] = await notes.getById([noteId]);

		if (!sourceNote) {
			console.warn(`Not found note with id ${noteId}`);
			return;
		}

		const { title, text } = sourceNote.content;
		const newNoteId = await notes.add({
			title: t('note.title.duplicate', { title }),
			text,
		});

		const attachedTags = await tagsRegistry.getAttachedTags(noteId);
		const attachedTagsIds = attachedTags.map(({ id }) => id);

		await tagsRegistry.setAttachedTags(newNoteId, attachedTagsIds);

		eventBus.emit(WorkspaceEvents.NOTES_UPDATED);
	});

	useWorkspaceCommandCallback(
		GLOBAL_COMMANDS.TOGGLE_NOTE_ARCHIVE,
		async ({ noteId }) => {
			const [note] = await notes.getById([noteId]);
			if (!note) {
				console.warn(`Not found note with id ${noteId}`);
				return;
			}

			const newArchivedState = !note.isArchived;
			await notes.updateMeta([noteId], {
				isArchived: newArchivedState,
			});
			eventBus.emit(WorkspaceEvents.NOTE_UPDATED, { noteId });

			telemetry.track(TELEMETRY_EVENT_NAME.NOTE_ARCHIVE_TOGGLE, {
				action: newArchivedState ? 'Added' : 'Removed',
			});
		},
	);

	useWorkspaceCommandCallback(
		GLOBAL_COMMANDS.TOGGLE_NOTE_BOOKMARK,
		async ({ noteId }) => {
			const [note] = await notes.getById([noteId]);
			if (!note) {
				console.warn(`Not found note with id ${noteId}`);
				return;
			}

			const newBookmarkedState = !note.isBookmarked;
			await notes.updateMeta([noteId], {
				isBookmarked: newBookmarkedState,
			});
			eventBus.emit(WorkspaceEvents.NOTE_UPDATED, { noteId });

			telemetry.track(TELEMETRY_EVENT_NAME.NOTE_BOOKMARK_TOGGLE, {
				action: newBookmarkedState ? 'Added' : 'Removed',
			});
		},
	);

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.TOGGLE_NOTE_PIN, async ({ noteId }) => {
		const [note] = await notes.getById([noteId]);
		if (!note) {
			console.warn(`Not found note with id ${noteId}`);
			return;
		}

		const newPinnedState = !note.isPinned;
		await notes.updateMeta([noteId], {
			isPinned: newPinnedState,
		});
		eventBus.emit(WorkspaceEvents.NOTE_UPDATED, { noteId, reason: 'meta' });

		telemetry.track(TELEMETRY_EVENT_NAME.NOTE_PIN_TOGGLE, {
			action: newPinnedState ? 'Pinned' : 'Unpinned',
		});
	});
};
