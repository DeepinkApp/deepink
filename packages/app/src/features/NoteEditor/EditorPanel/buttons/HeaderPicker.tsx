import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaHeading } from 'react-icons/fa6';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Button, ButtonProps, HStack, Menu, Portal, Text } from '@chakra-ui/react';

import { HeaderLevel } from '..';

export const HeaderPicker = ({
	onPick,
	defaultLevel,
	buttonProps,
	...props
}: Omit<React.ComponentProps<typeof Menu.Root>, 'children'> & {
	onPick: (level: HeaderLevel) => void;
	defaultLevel?: HeaderLevel;
	buttonProps?: ButtonProps;
}) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);
	const [level, setLevel] = useState<HeaderLevel>(defaultLevel ?? 1);
	useEffect(() => {
		if (!defaultLevel) return;
		setLevel(defaultLevel);
	}, [defaultLevel]);

	const onPress = useCallback(
		(level: HeaderLevel) => {
			onPick(level);
			setLevel(level);
		},
		[onPick],
	);

	const forceShowListRef = useRef(false);

	return (
		<Menu.Root {...props}>
			<Menu.Context>
				{({ open: isOpen }) => (
					<>
						<Menu.Trigger asChild>
							<Button
								size="sm"
								variant="ghost"
								title={t('editorPanel.header.insertTitle', { level })}
								minW="auto"
								{...buttonProps}
								onMouseUp={(evt) => {
									const isAltButton = [1, 2].includes(evt.button);
									if (isAltButton) {
										forceShowListRef.current = true;
										(evt.target as HTMLElement).click();
									}
								}}
								onClick={(evt) => {
									// Let user pick options
									if (forceShowListRef.current) {
										forceShowListRef.current = false;
										return;
									}

									// Let user pick option by click with modifiers
									// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
									if (evt.ctrlKey || evt.metaKey) return;

									// Use default level
									evt.preventDefault();
									evt.stopPropagation();
									onPress(level);
								}}
							>
								<FaHeading />
							</Button>
						</Menu.Trigger>
						{isOpen && (
							<Portal>
								<Menu.Positioner>
									<Menu.Content>
										{([1, 2, 3, 4, 5, 6] as const).map((level) => (
											<Menu.Item
												key={level}
												value={String(level)}
												paddingInlineEnd="1rem"
												onMouseDown={(evt) => {
													evt.preventDefault();
													evt.stopPropagation();
												}}
												onSelect={() => {
													onPress(level);
												}}
											>
												<HStack>
													<FaHeading />
													<Text>
														{t('editorPanel.header.level', {
															level,
														})}
													</Text>
												</HStack>
											</Menu.Item>
										))}
									</Menu.Content>
								</Menu.Positioner>
							</Portal>
						)}
					</>
				)}
			</Menu.Context>
		</Menu.Root>
	);
};
