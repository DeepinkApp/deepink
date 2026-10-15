import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { INote } from '@core/features/notes';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { useTelemetryTracker } from '@features/telemetry';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useCommand } from '@hooks/commands/useCommand';
import { useAppContextMenu } from '@hooks/useAppContextMenu';
import { useAppDispatch } from '@state/redux/hooks';
import { useVaultSelector, useWorkspaceActions } from '@state/redux/vaults/hooks';
import { selectDeletionConfig } from '@state/redux/vaults/selectors/vault';
import { MenuPosition } from '@utils/menu/AppContextMenu';

export enum NoteActions {
	DUPLICATE = 'duplicate',
	EXPORT = 'export',
	COPY_MARKDOWN_LINK = 'copyMdLink',
	DELETE_TO_BIN = 'deleteToBin',
	DELETE_PERMANENTLY = 'deletePermanently',
	RESTORE_FROM_BIN = 'restoreFromBin',

	CLOSE = 'CLOSE',
	CLOSE_ALL = 'CLOSE_ALL',
	CLOSE_OTHER_NOTES = 'CLOSE_OTHER_NOTES',
	CLOSE_TO_THE_RIGHT = 'CLOSE_TO_THE_RIGHT',
	CLOSE_TO_THE_LEFT = 'CLOSE_TO_THE_LEFT',
}

export const useNoteContextMenu = (context?: 'tabs' | 'notes-list') => {
	const telemetry = useTelemetryTracker();
	const { t } = useTranslation(LOCALE_NAMESPACE.menu, { keyPrefix: 'note' });
	const showMenu = useAppContextMenu();

	const deletionConfig = useVaultSelector(selectDeletionConfig);

	const dispatch = useAppDispatch();
	const workspaceActions = useWorkspaceActions();

	const runCommand = useCommand();

	return useCallback(
		(note: INote, point: MenuPosition) => {
			showMenu(
				[
					...(context === 'tabs'
						? ([
								{
									id: NoteActions.CLOSE,
									label: t('tab.close'),
									click() {
										dispatch(
											workspaceActions.closeNotes({
												query: { noteIds: [note.id] },
											}),
										);
									},
								},
								{
									id: NoteActions.CLOSE_OTHER_NOTES,
									label: t('tab.closeOthers'),
									click() {
										dispatch(
											workspaceActions.closeNotes({
												query: { all: true, exclude: [note.id] },
											}),
										);
									},
								},
								{
									id: NoteActions.CLOSE_TO_THE_LEFT,
									label: t('tab.closeToTheLeft'),
									click() {
										dispatch(
											workspaceActions.closeNotes({
												query: { beforeNoteId: note.id },
											}),
										);
									},
								},
								{
									id: NoteActions.CLOSE_TO_THE_RIGHT,
									label: t('tab.closeToTheRight'),
									click() {
										dispatch(
											workspaceActions.closeNotes({
												query: { afterNoteId: note.id },
											}),
										);
									},
								},
								{
									id: NoteActions.CLOSE_ALL,
									label: t('tab.closeAll'),
									click() {
										dispatch(
											workspaceActions.closeNotes({
												query: { all: true },
											}),
										);
									},
								},
								{ type: 'separator' },
							] as const)
						: []),

					...(note.isDeleted
						? [
								{
									id: NoteActions.RESTORE_FROM_BIN,
									label: t('restoreFromBin'),
									click() {
										runCommand(
											GLOBAL_COMMANDS.RESTORE_NOTE_FROM_BIN,
											{ noteId: note.id },
										);
									},
								},
							]
						: []),

					...(!note.isDeleted
						? [
								{
									id: NoteActions.DUPLICATE,
									label: t('duplicate'),
									click() {
										runCommand(GLOBAL_COMMANDS.DUPLICATE_NOTE, {
											noteId: note.id,
										});
									},
								},
							]
						: []),

					{
						id: NoteActions.EXPORT,
						label: t('export'),
						click() {
							runCommand(GLOBAL_COMMANDS.EXPORT_NOTE, { noteId: note.id });
						},
					},
					{
						id: NoteActions.COPY_MARKDOWN_LINK,
						label: t('copyMarkdownLink'),
						click() {
							runCommand(GLOBAL_COMMANDS.COPY_NOTE_MARKDOWN_LINK, {
								noteId: note.id,
							});
						},
					},
					{ type: 'separator' },

					deletionConfig.permanentDeletion || note.isDeleted
						? {
								id: NoteActions.DELETE_PERMANENTLY,
								label: t('deletePermanently'),
								click() {
									runCommand(GLOBAL_COMMANDS.DELETE_NOTE_PERMANENTLY, {
										noteId: note.id,
									});
								},
							}
						: {
								id: NoteActions.DELETE_TO_BIN,
								label: t('deleteToBin'),
								click() {
									runCommand(GLOBAL_COMMANDS.MOVE_NOTE_TO_BIN, {
										noteId: note.id,
									});
								},
							},
				],
				point,
			).then((item) => {
				if (!item) return;

				telemetry.track(TELEMETRY_EVENT_NAME.NOTE_CONTEXT_MENU_CLICK, {
					action: item.id,
				});
			});
		},
		[
			context,
			deletionConfig.permanentDeletion,
			dispatch,
			runCommand,
			showMenu,
			t,
			telemetry,
			workspaceActions,
		],
	);
};
