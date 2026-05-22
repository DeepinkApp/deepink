import React, { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaXmark } from 'react-icons/fa6';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Box, Button, HStack, Tabs, Text, VStack } from '@chakra-ui/react';

// TODO: let user change size
// TODO: add icons to tabs
export const NoteSidebar = ({
	tabs,
	activeTab,
	onActiveTabChanged,
	onClose,
}: {
	onClose: () => void;
	activeTab: string;
	onActiveTabChanged: (id: string) => void;
	tabs: {
		id: string;
		title: string;
		content: () => ReactNode;
	}[];
}) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);

	// Tabs to render
	const [openedTabs, setOpenedTabs] = useState([activeTab]);
	useEffect(() => {
		setOpenedTabs((openedTabs) =>
			Array.from(
				new Set(
					openedTabs
						.filter((id) => tabs.some((tab) => tab.id === id))
						.concat(activeTab),
				),
			),
		);
	}, [activeTab, tabs]);

	return (
		<VStack align="start" w="100%" h="100%" flex={1} gap="1rem">
			<HStack
				w="100%"
				alignItems="start"
				borderBottom="1px solid"
				bgColor="surface.panel"
				borderColor="surface.border"
			>
				<Tabs.Root
					value={activeTab}
					onValueChange={(details) => {
						onActiveTabChanged(details.value);
					}}
					maxH="100px"
					overflow="auto"
					flexShrink={1}
				>
					<Tabs.List display="flex" flexWrap="nowrap" overflow="auto">
						{tabs.map((tab) => {
							return (
								<Tabs.Trigger
									key={tab.id}
									value={tab.id}
									padding="0.4rem 0.7rem"
									border="none"
									fontWeight="600"
									fontSize="14"
									maxW="250px"
									minW="50px"
									whiteSpace="nowrap"
									flex="1 1 auto"
									marginBottom={0}
									title={tab.title}
									onMouseDown={(evt) => {
										const isLeftButton = evt.button === 0;
										if (isLeftButton) return;

										evt.preventDefault();
										evt.stopPropagation();
									}}
								>
									<HStack
										gap=".5rem"
										w="100%"
										justifyContent="space-between"
									>
										<Text
											maxW="180px"
											whiteSpace="nowrap"
											overflow="hidden"
											textOverflow="ellipsis"
										>
											{tab.title}
										</Text>
									</HStack>
								</Tabs.Trigger>
							);
						})}
					</Tabs.List>
				</Tabs.Root>

				<HStack marginLeft="auto" paddingTop=".3rem" paddingInlineEnd=".3rem">
					<Button
						variant="ghost"
						size="xs"
						title={t('note.sidebar.closePanel')}
						onClick={onClose}
					>
						<FaXmark />
					</Button>
				</HStack>
			</HStack>
			{tabs.map((tab) => {
				const isActive = tab.id === activeTab;
				const isOpened = isActive || openedTabs.includes(tab.id);

				if (!isOpened) return null;

				return (
					<Box
						key={tab.id}
						w="100%"
						overflow="auto"
						display={isActive ? 'flex' : 'none'}
						flex="1"
					>
						{tab.content()}
					</Box>
				);
			})}
		</VStack>
	);
};
