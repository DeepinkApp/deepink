import React, { FC, forwardRef, memo, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaXmark } from 'react-icons/fa6';
import { isEqual } from 'lodash';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Box, HStack, Tab, TabList, Tabs, Text } from '@chakra-ui/react';
import { INote, NoteId } from '@core/features/notes';
import { getNoteTitle } from '@core/features/notes/utils';
import { getContextMenuCoords } from '@electron/requests/contextMenu/renderer';
import { NoteClickOptions } from '@hooks/notes/useNoteActions';
import { useImmutableCallback } from '@hooks/useImmutableCallback';
import { useWorkspaceSelector } from '@state/redux/vaults/hooks';
import { selectPreviewTabId } from '@state/redux/vaults/selectors/notes';

import { useNoteContextMenu } from './NoteContextMenu/useNoteContextMenu';

export type TopBarProps = {
	tabs: NoteId[];
	activeTab: NoteId | null;
	onPick: (id: NoteId, options?: NoteClickOptions) => void;
	onClose: (id: NoteId) => void;

	notes: INote[];
};

// TODO: improve tab style
const NoteTab = memo(
	forwardRef<
		HTMLButtonElement,
		{
			note: INote;
			onPick: (id: NoteId, options?: NoteClickOptions) => void;
			onClose: (id: string) => void;
			isPreviewTab?: boolean;
		}
	>(({ note, onPick, onClose, isPreviewTab }, ref) => {
		const { t } = useTranslation(LOCALE_NAMESPACE.features);

		const title = getNoteTitle(note.content, 50);
		const openNoteContextMenu = useNoteContextMenu('tabs');

		return (
			<Tab
				ref={ref}
				padding="0.4rem 0.7rem"
				border="none"
				fontStyle={isPreviewTab ? 'italic' : undefined}
				fontWeight={isPreviewTab ? undefined : '600'}
				fontSize="14"
				maxW="250px"
				minW="150px"
				whiteSpace="nowrap"
				flex="1 1 auto"
				marginBottom={0}
				title={title}
				textDecorationLine={note.isDeleted ? 'line-through' : undefined}
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

					openNoteContextMenu(note, getContextMenuCoords(evt.nativeEvent));
				}}
				onDoubleClick={
					isPreviewTab ? () => onPick(note.id, { preview: false }) : undefined
				}
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
							onClose(note.id);
						}}
					>
						<FaXmark />
					</Box>
				</HStack>
			</Tab>
		);
	}),
	isEqual,
);

export const OpenedNotesPanel: FC<TopBarProps> = ({
	notes,
	tabs,
	activeTab,
	onClose,
	onPick,
}) => {
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

	const previewTabId = useWorkspaceSelector(selectPreviewTabId);

	const immutableCallbacks = {
		onPick: useImmutableCallback(onPick, [onPick]),
		onClose: useImmutableCallback(onClose, [onClose]),
	};

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

					return (
						<NoteTab
							key={note.id}
							ref={isActiveTab ? activeTabRef : undefined}
							{...immutableCallbacks}
							note={note}
							isPreviewTab={previewTabId === note.id}
						/>
					);
				})}
			</TabList>
		</Tabs>
	);
};
