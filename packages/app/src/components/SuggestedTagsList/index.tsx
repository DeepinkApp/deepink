import React, { FC, useCallback, useMemo, useRef } from 'react';
import Downshift from 'downshift';
import Fuse from 'fuse.js';
import {
	Box,
	BoxProps,
	Input,
	InputProps,
	List,
	Text,
	useControllableState,
} from '@chakra-ui/react';
import { IResolvedTag } from '@core/features/tags';

import { VirtualList } from '../VirtualList';

export type ListItem = {
	id: string;
	content: string;
};

export type ISuggestedTagsListProps = BoxProps & {
	/**
	 * Available tags
	 */
	tags: IResolvedTag[];

	selectedTag?: IResolvedTag;

	onPick?: (tag: IResolvedTag) => void;

	onCreateTag?: (tagName: string) => void;
	hasTagName?: (tagName: string) => boolean;

	placeholder?: string;
	inputProps?: InputProps;

	inputValue?: string;
	onInputChange?: (inputValue: string) => void;
};

// TODO: define style with theme
export const SuggestedTagsList: FC<ISuggestedTagsListProps> = ({
	tags,
	selectedTag,
	onPick,
	onCreateTag,
	hasTagName,
	placeholder,
	inputProps,
	inputValue,
	onInputChange,
	...props
}) => {
	const [input, setInput] = useControllableState({
		defaultValue: selectedTag ? selectedTag.resolvedName : '',
		value: inputValue,
		onChange: onInputChange,
	});

	const listRootRef = useRef<HTMLDivElement>(null);

	const fixedTagName = input
		.trim()
		.replace(/\/{2,}/g, '/')
		.split('/')
		.filter(Boolean)
		.join('/');

	const fuse = useMemo(() => {
		return new Fuse(tags, {
			keys: ['resolvedName'],
			threshold: 0.3,
			ignoreLocation: true,
			minMatchCharLength: 1,
		});
	}, [tags]);

	const listItems = useMemo<ListItem[]>(() => {
		const normalizedInput = input.trim();

		const filteredTags: ListItem[] = !normalizedInput
			? tags.map(({ id, resolvedName }) => ({
					id,
					content: resolvedName,
				}))
			: fuse.search(normalizedInput).map(({ item }) => ({
					id: item.id,
					content: item.resolvedName,
				}));

		if (
			onCreateTag &&
			fixedTagName &&
			!filteredTags.some((tag) => tag.content === fixedTagName)
		) {
			if (!hasTagName || !hasTagName(fixedTagName)) {
				return [
					{
						id: 'createNew',
						content: `Create tag "${fixedTagName}"`,
					},
					...filteredTags,
				];
			}
		}

		return filteredTags;
	}, [fuse, fixedTagName, hasTagName, input, onCreateTag, tags]);

	const handleChange = useCallback(
		(selection: null | ListItem) => {
			if (!selection) return;

			const { id } = selection;

			if (id === 'createNew') {
				setInput('');

				if (onCreateTag && fixedTagName) {
					onCreateTag(fixedTagName);
				}

				return;
			}

			if (!onPick) return;

			const tag = tags.find((tag) => tag.id === id);

			if (tag) {
				onPick(tag);
			}
		},
		[fixedTagName, onCreateTag, onPick, setInput, tags],
	);

	return (
		<Downshift
			onStateChange={({ inputValue }) => {
				if (inputValue !== undefined) {
					setInput(inputValue ?? '');
				}
			}}
			inputValue={input}
			onChange={handleChange}
			itemToString={(item) => (item ? item.content : '')}
			itemCount={listItems.length}
		>
			{({
				getInputProps,
				getItemProps,
				getMenuProps,
				isOpen,
				getRootProps,
				highlightedIndex,
			}) => (
				<Box w="100%" position="relative" {...props}>
					<Box
						display="inline-block"
						w="100%"
						{...getRootProps({}, { suppressRefError: true })}
					>
						<Input
							{...getInputProps()}
							{...{ placeholder, ...inputProps }}
							w="100%"
						/>
					</Box>

					{isOpen && listItems.length > 0 && (
						<VirtualList
							count={listItems.length}
							activeIndex={highlightedIndex ?? undefined}
							getScrollElement={() => listRootRef.current}
							estimateSize={() => 35}
							overscan={6}
							useFlushSync={false}
						>
							{(virtualizer) => (
								<Box
									ref={listRootRef}
									position="absolute"
									overflow="auto"
									maxHeight="300px"
									maxW="600px"
									w="100%"
									overflowX="hidden"
									margin={0}
									marginTop=".3rem"
									zIndex={999}
									border="1px solid"
									borderColor="surface.border"
									backgroundColor="surface.background"
									borderRadius="6px"
								>
									<List.Root
										as="ul"
										{...getMenuProps()}
										minHeight={virtualizer.getTotalSize()}
										paddingBlock=".3rem"
										margin={0}
										flexShrink={0}
									>
										{virtualizer
											.getVirtualItems()
											.map((virtualRow, virtualItemPosition) => {
												const item = listItems[virtualRow.index];

												return (
													<List.Item
														ref={virtualizer.measureElement}
														// @ts-expect-error ensure key
														key={item.id}
														data-index={virtualRow.index}
														listStyleType="none"
														css={{
															padding: '.3rem',
															paddingInline: '1rem',
															fontSize: '1rem',
														}}
														marginTop={
															virtualItemPosition === 0
																? virtualRow.start
																: undefined
														}
														{...getItemProps({
															key: item.id,
															index: virtualRow.index,
															item,
														})}
													>
														<Text
															maxW="100%"
															whiteSpace="nowrap"
															wordBreak="break-word"
															textOverflow="ellipsis"
															overflow="hidden"
														>
															{item.content}
														</Text>
													</List.Item>
												);
											})}
									</List.Root>
								</Box>
							)}
						</VirtualList>
					)}
				</Box>
			)}
		</Downshift>
	);
};
