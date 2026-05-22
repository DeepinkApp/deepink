import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFeather } from 'react-icons/fa6';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Separator, Text, VStack } from '@chakra-ui/react';
import { NestedList } from '@components/NestedList';
import { Popper } from '@components/Popper';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { useTelemetryTracker } from '@features/telemetry';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import {
	EditorMode,
	selectEditorMode,
	settingsApi,
} from '@state/redux/settings/settings';
import { useWorkspaceSelector } from '@state/redux/vaults/hooks';
import { selectOpenedNotes } from '@state/redux/vaults/vaults';

import { useStatusBarManager } from '../../MainScreen/StatusBar/StatusBarProvider';

/**
 * Editor mode IDs mapped to their i18n keys in the features namespace.
 * Used by EditorConfig settings to display mode names.
 */
export const editorModes: Record<EditorMode, string> = {
	plaintext: 'Plain text',
	richtext: 'Rich text',
	'split-screen': 'Split screen',
};

export const EditorModePicker = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);
	const telemetry = useTelemetryTracker();

	const { controls } = useStatusBarManager();

	const dispatch = useAppDispatch();
	const editorMode = useAppSelector(selectEditorMode);

	const [isVisible, setIsVisible] = useState(false);
	const [referenceRef, setReferenceRef] = useState<HTMLElement | null>(null);

	const openedNotes = useWorkspaceSelector(selectOpenedNotes);
	const isNotesOpened = openedNotes.length > 0;

	const editorModeLabel = t(`note.editor.modes.${editorMode}`);

	useEffect(() => {
		// Update state by close notes
		setIsVisible((state) => (isNotesOpened ? state : false));

		controls.update(
			'editor-mode',
			{
				visible: isNotesOpened,
				title: t('editor.mode.title', { ns: LOCALE_NAMESPACE.settings }),
				text: editorModeLabel,
				icon: <FaFeather />,
				onClick: () => setIsVisible((state) => !state),
				ref: setReferenceRef,
			},
			{
				placement: 'end',
				priority: 99_000,
			},
		);
	}, [controls, editorMode, editorModeLabel, isNotesOpened, t]);

	useEffect(() => {
		return () => {
			controls.unregister('editor-mode');
		};
	}, [controls]);

	const onClose = () => setIsVisible(false);

	if (!isVisible) return null;

	return (
		<Popper
			referenceRef={referenceRef ?? undefined}
			onClose={onClose}
			backgroundColor="surface.background"
			border="1px solid"
			borderColor="surface.border"
			minW="150px"
		>
			<VStack gap={0} align="start">
				<Text padding=".5rem" fontWeight="bold">
					{t('editor.mode.title', { ns: LOCALE_NAMESPACE.settings })}
				</Text>
				<Separator />
				<NestedList
					items={(
						['plaintext', 'richtext', 'split-screen'] as EditorMode[]
					).map((id) => ({
						id,
						content: <Text p=".5rem">{t(`note.editor.modes.${id}`)}</Text>,
					}))}
					onPick={(id) => {
						dispatch(settingsApi.setEditorMode(id as EditorMode));
						onClose();

						telemetry.track(TELEMETRY_EVENT_NAME.EDITOR_MODE_CHANGED, {
							editorMode: id,
						});
					}}
				/>
			</VStack>
		</Popper>
	);
};
