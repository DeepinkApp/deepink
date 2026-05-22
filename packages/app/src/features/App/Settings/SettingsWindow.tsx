import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	FaFileImport,
	FaGear,
	FaInbox,
	FaKeyboard,
	FaPalette,
	FaVault,
} from 'react-icons/fa6';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Box, Dialog, Portal, Tabs, Text } from '@chakra-ui/react';
import { TextWithIcon } from '@components/TextWithIcon';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useWorkspaceCommandCallback } from '@hooks/commands/useWorkspaceCommandCallback';

import { AppearanceSettings } from './sections/appearance';
import { GeneralSettings } from './sections/GeneralSettings';
import { HotKeysSettings } from './sections/HotKeysSettings';
import { ImportAndExport } from './sections/ImportAndExport';
import { VaultSettings } from './sections/VaultSettings';
import { WorkspaceSettings } from './sections/WorkspaceSettings';

// TODO: add icons
type SettingsSection = {
	id: string;
	titleKey: string;
	component: React.ComponentType;
	icon?: React.ComponentType;
};

// TODO: add help section with links
export const SettingsWindow = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.settings);

	const tabs: SettingsSection[] = [
		{
			id: 'general',
			titleKey: 'tabs.general',
			component: GeneralSettings,
			icon: FaGear,
		},
		{
			id: 'appearance',
			titleKey: 'tabs.appearance',
			component: AppearanceSettings,
			icon: FaPalette,
		},
		{
			id: 'hotkeys',
			titleKey: 'tabs.hotkeys',
			component: HotKeysSettings,
			icon: FaKeyboard,
		},
	];

	const vaultTabs: SettingsSection[] = [
		{
			id: 'vault',
			titleKey: 'tabs.vault',
			component: VaultSettings,
			icon: FaVault,
		},
		{
			id: 'workspace',
			titleKey: 'tabs.workspace',
			component: WorkspaceSettings,
			icon: FaInbox,
		},
		{
			id: 'import-and-export',
			titleKey: 'tabs.importExport',
			component: ImportAndExport,
			icon: FaFileImport,
		},
	];

	const [isOpen, setIsOpen] = useState(false);

	useWorkspaceCommandCallback(GLOBAL_COMMANDS.OPEN_GLOBAL_SETTINGS, () => {
		setIsOpen(true);
	});

	return (
		<Dialog.Root
			open={isOpen}
			size="xl"
			closeOnEscape={false}
			onOpenChange={(e) => {
				if (!e.open) {
					setIsOpen(false);
				}
			}}
		>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content maxWidth="800px" minHeight="500px">
						<Dialog.Header paddingInline="1rem">
							{t('window.title')}
						</Dialog.Header>
						<Dialog.CloseTrigger />
						<Dialog.Body paddingInline="1rem" paddingBlockEnd="2rem">
							<Tabs.Root
								orientation="vertical"
								gap="1rem"
								lazyMount
								defaultValue="general"
							>
								<Tabs.List
									display="flex"
									flexWrap="wrap"
									width="200px"
									gap="1px"
									flexShrink={0}
								>
									{tabs.map((tab) => {
										return (
											<Tabs.Trigger
												key={tab.id}
												value={tab.id}
												justifyContent="start"
												borderRadius="4px"
												padding=".3rem .5rem"
												maxWidth="100%"
											>
												<TextWithIcon
													icon={
														tab.icon && (
															<Box flexShrink={0} asChild>
																<tab.icon />
															</Box>
														)
													}
													overflow="hidden"
													textProps={{
														css: {
															whiteSpace: 'nowrap',
															textOverflow: 'ellipsis',
															overflow: 'hidden',
														},
													}}
												>
													{t(tab.titleKey)}
												</TextWithIcon>
											</Tabs.Trigger>
										);
									})}

									<Text fontWeight="bold" marginTop="2rem">
										{t('tabs.vaultSettingsGroup')}
									</Text>
									{vaultTabs.map((tab) => {
										return (
											<Tabs.Trigger
												key={tab.id}
												value={tab.id}
												justifyContent="start"
												borderRadius="4px"
												padding=".3rem .5rem"
												maxWidth="100%"
											>
												<TextWithIcon
													icon={
														tab.icon && (
															<Box flexShrink={0} asChild>
																<tab.icon />
															</Box>
														)
													}
													overflow="hidden"
													textProps={{
														css: {
															whiteSpace: 'nowrap',
															textOverflow: 'ellipsis',
															overflow: 'hidden',
														},
													}}
												>
													{t(tab.titleKey)}
												</TextWithIcon>
											</Tabs.Trigger>
										);
									})}
								</Tabs.List>

								<Box maxWidth="600px" minWidth="400px" width="100%">
									{tabs.map((tab) => {
										return (
											<Tabs.Content
												key={tab.id}
												value={tab.id}
												padding={0}
											>
												{tab.id !== 'general' && (
													<Text
														fontSize="1.5rem"
														lineHeight="1"
														marginBottom="1rem"
													>
														{t(tab.titleKey)}
													</Text>
												)}
												<tab.component />
											</Tabs.Content>
										);
									})}

									{vaultTabs.map((tab) => {
										return (
											<Tabs.Content
												key={tab.id}
												value={tab.id}
												padding={0}
											>
												<Text
													fontSize="1.5rem"
													lineHeight="1"
													marginBottom="1rem"
												>
													{t(tab.titleKey)}
												</Text>
												<tab.component />
											</Tabs.Content>
										);
									})}
								</Box>
							</Tabs.Root>
						</Dialog.Body>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};
