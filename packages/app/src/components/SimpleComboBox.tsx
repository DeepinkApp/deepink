import React, { ReactNode, useRef, useState } from 'react';
import Downshift from 'downshift';
import { Box, BoxProps, Input, InputProps, List } from '@chakra-ui/react';
import { Popper } from '@components/Popper';

import { VirtualList } from './VirtualList';

export const SimpleComboBox = <T extends unknown>({
	autoFocusItem,
	items,
	itemToString,
	renderItem,
	placeholder,
	inputProps,
	inputValue,
	onInputChange,
	...props
}: {
	placeholder?: string;
	inputProps?: InputProps;

	inputValue?: string;
	onInputChange?: (inputValue: string) => void;

	autoFocusItem?: boolean;

	items: T[];
	itemToString: (item: T | null) => string;
	renderItem: (item: T) => ReactNode;
} & BoxProps) => {
	const listRootRef = useRef<HTMLDivElement>(null);
	const [inputRef, setInputRef] = useState<HTMLInputElement | null>(null);

	return (
		<Downshift
			inputValue={inputValue}
			onInputValueChange={(value) => {
				onInputChange?.(value ?? '');
			}}
			itemCount={items.length}
			itemToString={itemToString}
			defaultHighlightedIndex={autoFocusItem ? 0 : undefined}
			stateReducer={(state, changes) => {
				// Clear input only by second escape press
				if (
					changes.type === Downshift.stateChangeTypes.keyDownEscape &&
					(items.length === 0 || !state.isOpen)
				) {
					return changes;
				}

				return {
					...changes,
					inputValue: state.inputValue,
				};
			}}
		>
			{({
				getInputProps,
				getItemProps,
				getMenuProps,
				isOpen,
				getRootProps,
				highlightedIndex,
				openMenu,
			}) => {
				return (
					<Box w="100%" position="relative" {...props}>
						<Box
							display="inline-block"
							w="100%"
							{...getRootProps({}, { suppressRefError: true })}
						>
							<Input
								{...getInputProps({
									onClick() {
										openMenu();
									},
								})}
								{...{ placeholder, ...inputProps }}
								w="100%"
								ref={(node) => setInputRef(node)}
							/>
						</Box>
						{isOpen && items.length > 0 && renderItem && (
							<Popper
								referenceRef={inputRef ?? undefined}
								allowedPlacements={['top', 'bottom']}
								offset={{ mainAxis: 5 }}
								zIndex={999999}
								onMouseDownCapture={(evt) => {
									// Prevent focus by click scroll bar
									evt.preventDefault();
								}}
							>
								<VirtualList
									count={items.length}
									activeIndex={highlightedIndex ?? undefined}
									getScrollElement={() => listRootRef.current}
									estimateSize={() => 40}
									overscan={6}
									useFlushSync={false}
								>
									{(virtualizer) => {
										return (
											<Box
												ref={listRootRef}
												width="400px"
												maxHeight="inherit"
												overflow="auto"
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
														.map(
															(
																virtualRow,
																virtualItemPosition,
															) => {
																const item =
																	items[
																		virtualRow.index
																	];

																return (
																	<List.Item
																		{...getItemProps({
																			key: virtualRow.index,
																			index: virtualRow.index,
																			item,
																		})}
																		ref={
																			virtualizer.measureElement
																		}
																		key={
																			virtualRow.index
																		}
																		data-index={
																			virtualRow.index
																		}
																		listStyleType="none"
																		width="100%"
																		// Set margin for first rendered item, to offset all items above
																		// That is necessary to show user items slice after scroll
																		marginTop={
																			virtualItemPosition ===
																			0
																				? virtualRow.start
																				: undefined
																		}
																	>
																		{renderItem(item)}
																	</List.Item>
																);
															},
														)}
												</List.Root>
											</Box>
										);
									}}
								</VirtualList>
							</Popper>
						)}
					</Box>
				);
			}}
		</Downshift>
	);
};
