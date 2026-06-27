import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaClockRotateLeft } from 'react-icons/fa6';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { useStatusBarManager } from '@features/MainScreen/StatusBar/StatusBarProvider';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useCommand } from '@hooks/commands/useCommand';
import { useLocalizedDate } from '@hooks/useLocalizedDate';
import { useAppSelector } from '@state/redux/hooks';
import { selectEditorDateFormat } from '@state/redux/settings/selectors/preferences';
import { useWorkspaceSelector } from '@state/redux/vaults/hooks';
import { createWorkspaceSelector } from '@state/redux/vaults/utils';
import { selectActiveNote } from '@state/redux/vaults/vaults';

/**
 * Select short summary of active note meta
 */
export const selectActiveNoteStats = createWorkspaceSelector(
	[selectActiveNote],
	(activeNote) => {
		if (!activeNote) return null;

		return { id: activeNote.id, updatedTimestamp: activeNote.updatedTimestamp };
	},
);

export const useActiveNoteHistoryButton = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);

	const runCommand = useCommand();

	const localizedDate = useLocalizedDate();
	const dateFormat = useAppSelector(selectEditorDateFormat);

	// Note items on status bar
	const statusBarButtons = useStatusBarManager();

	const activeNoteStats = useWorkspaceSelector(selectActiveNoteStats);
	useEffect(() => {
		if (!activeNoteStats) return;

		const { id, updatedTimestamp } = activeNoteStats;

		const noteDate = updatedTimestamp
			? localizedDate(new Date(updatedTimestamp), dateFormat)
			: null;

		statusBarButtons.controls.register(
			'noteTime',
			{
				visible: noteDate !== null,
				title: t('statusBar.history'),
				icon: <FaClockRotateLeft />,
				text: noteDate ?? '',
				onClick: () =>
					runCommand(GLOBAL_COMMANDS.TOGGLE_NOTE_HISTORY_PANEL, {
						noteId: id,
					}),
			},
			{
				placement: 'end',
				priority: 1000,
			},
		);

		return () => {
			statusBarButtons.controls.unregister('noteTime');
		};
	}, [
		dateFormat,
		localizedDate,
		activeNoteStats,
		runCommand,
		statusBarButtons.controls,
		t,
	]);
};
