import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { FaBoxArchive, FaCompass, FaStar, FaTrash } from 'react-icons/fa6';
import { IconBaseProps } from 'react-icons/lib';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { ButtonGroup, HStack } from '@chakra-ui/react';
import { IconButton } from '@components/IconButton';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/vaults/hooks';
import { selectNotesView } from '@state/redux/vaults/selectors/view';
import { NOTES_VIEW, workspacesApi } from '@state/redux/vaults/vaults';

export type NotesOverviewProps = {};

export const NotesViewFilter: FC<NotesOverviewProps> = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();

	const filterOptions = [
		{
			id: NOTES_VIEW.All_NOTES,
			icon: FaCompass,
			labelKey: 'notesView.allNotes',
		},
		{
			id: NOTES_VIEW.BOOKMARK,
			icon: (props: IconBaseProps) => (
				<FaStar {...props} style={{ transform: 'scale(1.1)', ...props.style }} />
			),
			labelKey: 'notesView.favorites',
		},
		{
			id: NOTES_VIEW.ARCHIVE,
			icon: FaBoxArchive,
			labelKey: 'notesView.archived',
		},
		{
			id: NOTES_VIEW.BIN,
			icon: FaTrash,
			labelKey: 'notesView.deleted',
		},
	];

	const notesViewMode = useWorkspaceSelector(selectNotesView);
	return (
		<HStack w="100%" justifyContent="center">
			<ButtonGroup gap=".3rem" size="sm" variant="ghost">
				{filterOptions.map(({ id, labelKey, ...option }) => (
					<IconButton
						key={id}
						icon={<option.icon />}
						title={t(labelKey)}
						data-no-animation
						data-active={id === notesViewMode ? '' : undefined}
						onClick={() => {
							dispatch(
								workspacesApi.setView({
									...workspaceData,
									view: id,
								}),
							);

							dispatch(
								workspacesApi.setSelectedTag({
									...workspaceData,
									tag: null,
								}),
							);
						}}
					/>
				))}
			</ButtonGroup>
		</HStack>
	);
};
