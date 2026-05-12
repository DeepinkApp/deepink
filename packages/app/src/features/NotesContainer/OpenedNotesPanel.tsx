import React, { FC, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaXmark } from 'react-icons/fa6';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Box, HStack, Tab, TabList, Tabs, Text } from '@chakra-ui/react';
import { INote, NoteId } from '@core/features/notes';
import { getNoteTitle } from '@core/features/notes/utils';
import { getContextMenuCoords } from '@electron/requests/contextMenu/renderer';
import { useWorkspaceSelector } from '@state/redux/vaults/hooks';
import { selectTemporaryNoteId } from '@state/redux/vaults/selectors/notes';

import { useNoteContextMenu } from './NoteContextMenu/useNoteContextMenu';

export type TopBarProps = {
	tabs: NoteId[];
	activeTab: NoteId | null;
	onPick: (id: NoteId, options?: { preview: boolean }) => void;
	onClose: (id: NoteId) => void;

	notes: INote[];
};

// TODO: improve tabs style
export const OpenedNotesPanel: FC<TopBarProps> = ({
	notes,
	tabs,
	activeTab,
	onClose,
	onPick,
}) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);
	const openNoteContextMenu = useNoteContextMenu();

	const existsTabs = useMemo(
		() => tabs.filter((noteId) => notes.some((note) => note.id === noteId)),
		[tabs, notes],
	);

	const tabIndex = useMemo(() => {
		const tabId = existsTabs.findIndex((tabId) => tabId === activeTab);
		return tabId >= 0 ? tabId : 0;
	}, [activeTab, existsTabs]);

	const activeTabRef = useRef<HTMLButtonElement>(null);
	useEffect(() => {
		activeTabRef.current?.scrollIntoView();
	}, [tabIndex]);

	const temporaryNote = useWorkspaceSelector(selectTemporaryNoteId);

	return (
		<Tabs
			index={tabIndex}
			onChange={(index) => {
				onPick(existsTabs[index]);
			}}
			w="100%"
			maxH="100px"
			paddingTop=".5rem"
			paddingInline=".5rem"
			overflow="auto"
			bgColor="surface.panel"
			flexShrink={0}
			borderBottom="1px solid"
			borderColor="surface.border"
		>
			<TabList display="flex" flexWrap="wrap" overflow="hidden">
				{existsTabs.map((noteId, index) => {
					const isActiveTab = index === tabIndex;

					// TODO: handle case when object not found
					const note = notes.find((note) => note.id === noteId);
					if (!note) {
						throw new Error('Note not found');
					}

					const title = getNoteTitle(note.content, 50);
					const isTemporaryTab = temporaryNote === note.id;

					return (
						<Tab
							key={note.id}
							ref={isActiveTab ? activeTabRef : undefined}
							padding="0.4rem 0.7rem"
							border="none"
							fontStyle={isTemporaryTab ? 'italic' : undefined}
							fontWeight={isTemporaryTab ? undefined : '600'}
							fontSize="14"
							maxW="250px"
							minW="150px"
							whiteSpace="nowrap"
							flex="1 1 auto"
							marginBottom={0}
							title={title}
							textDecorationLine={
								note.isDeleted ? 'line-through' : undefined
							}
							onMouseDown={(evt) => {
								// Prevent focus capturing by click
								evt.preventDefault();

								const isLeftButton = evt.button === 0;
								if (isLeftButton) return;

								evt.preventDefault();
								evt.stopPropagation();
							}}
							onMouseUp={(evt) => {
								const isMiddleButton = evt.button === 1;
								if (!isMiddleButton) return;

								onClose(note.id);
							}}
							onContextMenu={(evt) => {
								// Prevent text selection on macOS
								evt.preventDefault();

								openNoteContextMenu(
									note,
									getContextMenuCoords(evt.nativeEvent),
								);
							}}
							onDoubleClick={() => onPick(note.id, { preview: false })}
						>
							<HStack gap=".5rem" w="100%" justifyContent="space-between">
								<Text
									maxW="180px"
									whiteSpace="nowrap"
									overflow="hidden"
									textOverflow="ellipsis"
								>
									{title}
								</Text>
								<Box
									title={t('tabBar.closeTab')}
									sx={{
										'&:not(:hover)': {
											opacity: '0.7',
										},
									}}
									onClick={(evt) => {
										evt.stopPropagation();
										onClose(noteId);
									}}
								>
									<FaXmark />
								</Box>
							</HStack>
						</Tab>
					);
				})}
			</TabList>
		</Tabs>
	);
};
