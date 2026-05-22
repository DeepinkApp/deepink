import React, { FC, useCallback } from 'react';
import Downshift from 'downshift';
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

	const fixedTagName = input
		.trim()
		.replace(/\/{2,}/g, '/')
		.split('/')
		.filter(Boolean)
		.join('/');

	const getListItems = useCallback(
		(inputValue: string | null) => {
			const filteredTags: ListItem[] = [...tags]
				.filter(
					({ resolvedName }) =>
						!inputValue ||
						resolvedName.toLowerCase().includes(inputValue.toLowerCase()),
				)
				.map(
					({ id, resolvedName }) =>
						({
							id,
							content: resolvedName,
						}) as ListItem,
				);

			// Add button to create new tag
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
						} as ListItem,
						...filteredTags,
					];
				}
			}

			return filteredTags;
		},
		[fixedTagName, hasTagName, onCreateTag, tags],
	);

	return (
		<Downshift
			onStateChange={({ inputValue }) => {
				if (inputValue !== undefined) {
					setInput(inputValue ?? '');
				}
			}}
			inputValue={input}
			onChange={(selection: null | ListItem) => {
				if (!selection) return;

				const { id } = selection;

				if (id === 'createNew') {
					setInput('');
					if (onCreateTag && fixedTagName) {
						onCreateTag(fixedTagName);
					}
				} else if (onPick) {
					const tag = tags.find((tag) => tag.id === id);
					if (tag) {
						onPick(tag);
					}
				}
			}}
			itemToString={(item) => (item ? item.content : '')}
		>
			{({
				getInputProps,
				getItemProps,
				getMenuProps,
				isOpen,
				inputValue,
				getRootProps,
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
					{isOpen && (
						<List.Root
							as="ul"
							{...getMenuProps()}
							position="absolute"
							overflow="auto"
							maxHeight="300px"
							maxW="300px"
							overflowX="hidden"
							margin={0}
							marginTop=".3rem"
							zIndex={999}
							border="1px solid"
							borderColor="surface.border"
							backgroundColor="surface.background"
							borderRadius="6px"
							paddingBlock=".3rem"
						>
							{getListItems(inputValue).map((item, index) => {
								return (
									<List.Item
										// @ts-expect-error ensure key
										key={item.id}
										listStyleType="none"
										css={{
											padding: '.3rem',
											paddingInline: '1rem',
											fontSize: '1rem',
										}}
										{...getItemProps({
											key: item.id,
											index,
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
					)}
				</Box>
			)}
		</Downshift>
	);
};
