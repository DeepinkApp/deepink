import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaMagnifyingGlass, FaXmark } from 'react-icons/fa6';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { useDebouncedCallback } from 'use-debounce';
import {
	Box,
	HStack,
	Input,
	InputGroup,
	Separator,
	Tag,
	Text,
	VStack,
} from '@chakra-ui/react';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { useWorkspaceContainer } from '@features/App/Workspace/WorkspaceProvider';
import { NotesList } from '@features/MainScreen/NotesListPanel/NotesList';
import { useTelemetryTracker } from '@features/telemetry';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useWorkspaceCommandCallback } from '@hooks/commands/useWorkspaceCommandCallback';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/vaults/hooks';
import { selectActiveTag, selectSearch, workspacesApi } from '@state/redux/vaults/vaults';

export const NotesListPanel = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);
	const {
		notesIndex: { index: notesIndex },
	} = useWorkspaceContainer();

	const telemetry = useTelemetryTracker();

	const dispatch = useAppDispatch();

	const search = useWorkspaceSelector(selectSearch);
	const activeTag = useWorkspaceSelector(selectActiveTag);

	const workspaceData = useWorkspaceData();
	const setSearch = useCallback(
		(value: string) => {
			dispatch(
				workspacesApi.setSearch({
					...workspaceData,
					search: value,
				}),
			);

			if (value.trim().length > 0) {
				telemetry.track(TELEMETRY_EVENT_NAME.SEARCH_IN_NOTES);
			}
		},
		[dispatch, telemetry, workspaceData],
	);

	const [searchInput, setSearchInput] = useState(search);

	const debouncedSearchUpdate = useDebouncedCallback(setSearch, 300);
	useEffect(() => {
		debouncedSearchUpdate(searchInput);
	}, [debouncedSearchUpdate, searchInput]);

	useEffect(() => {
		debouncedSearchUpdate.cancel();
		setSearchInput(search);
	}, [debouncedSearchUpdate, search]);

	const clearSearch = () => {
		debouncedSearchUpdate.cancel();
		setSearch('');
		setSearchInput('');
	};

	const searchInputRef = useRef<HTMLInputElement | null>(null);
	useWorkspaceCommandCallback(GLOBAL_COMMANDS.FOCUS_SEARCH, () =>
		searchInputRef.current?.focus(),
	);

	return (
		<VStack
			align="start"
			css={{
				width: '100%',
				height: '100%',
				flexDirection: 'column',
				gap: '.5rem',
			}}
		>
			<VStack align="start" w="100%" gap="0.5rem">
				<HStack w="100%">
					<InputGroup
						startElement={<FaMagnifyingGlass />}
						endElement={
							searchInput.length > 0 ? (
								<Box
									as="button"
									tabIndex={-1}
									onClick={clearSearch}
									cursor="pointer"
								>
									<FaXmark />
								</Box>
							) : undefined
						}
					>
						<Input
							size="sm"
							ref={searchInputRef}
							placeholder={t('notesList.search.placeholder')}
							value={searchInput}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								setSearchInput(e.target.value)
							}
							onKeyUp={(e) => {
								if (e.key === 'Escape') clearSearch();
							}}
							// Load index by focus on search
							onFocus={() => notesIndex.load()}
						/>
					</InputGroup>
				</HStack>

				{activeTag && (
					<HStack align="start" gap="0.5rem" maxW="100%">
						<Text variant="secondary" flexShrink={0} alignSelf="center">
							{t('notesList.filterBy')}
						</Text>
						<HStack maxW="100%" align="start" overflow="hidden">
							<Tag.Root
								variant="static"
								gap=".5rem"
								title={activeTag.resolvedName}
								asChild
							>
								<HStack>
									<Text
										maxW="100%"
										whiteSpace="nowrap"
										overflow="hidden"
										textOverflow="ellipsis"
										dir="rtl"
									>
										{activeTag.resolvedName}
									</Text>
									<Box
										css={{
											'& &:not(:hover)': {
												opacity: '0.7',
											},
										}}
										onClick={() => {
											dispatch(
												workspacesApi.setSelectedTag({
													...workspaceData,
													tag: null,
												}),
											);
										}}
									>
										<FaXmark />
									</Box>
								</HStack>
							</Tag.Root>
						</HStack>
					</HStack>
				)}
			</VStack>
			<Separator />
			<NotesList />
		</VStack>
	);
};
