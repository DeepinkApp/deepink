import React, { Fragment, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Box, HStack, Separator, Text } from '@chakra-ui/react';
import { Features } from '@components/Features/Features';
import { FeaturesPanel } from '@components/Features/Group';
import { SHORTCUT_I18N_KEYS, SHORTCUTS_MAP } from '@hooks/shortcuts';

// TODO: implement recording view
export const KeyboardShortcut = ({ shortcut }: { shortcut?: string }) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.settings);

	const keys = useMemo(() => {
		if (!shortcut) return [];

		const isMacOS = navigator.userAgent.includes('Mac OS');
		return shortcut
			.split('+')
			.map((k) => k.trim().replaceAll(/cmdorctrl/gi, isMacOS ? 'Cmd' : 'Ctrl'))
			.filter(Boolean);
	}, [shortcut]);

	// TODO: use icons for some buttons
	return (
		<Box
			padding=".2rem .5rem"
			fontSize=".8rem"
			backgroundColor="dim.200"
			borderRadius="6px"
			cursor="default"
			userSelect="none"
		>
			{keys.length > 0 ? keys.join(' + ') : t('hotkeys.blank')}
		</Box>
	);
};

export const HotKeysSettings = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.settings);

	return (
		<Features>
			<FeaturesPanel padding="1rem">
				{Object.entries(SHORTCUTS_MAP).map(([shortcuts, command], index) => {
					return (
						<Fragment key={command}>
							{index > 0 && <Separator />}
							<HStack w="100%">
								<Text>{t(SHORTCUT_I18N_KEYS[command])}</Text>
								<Box marginInlineStart="auto">
									<KeyboardShortcut shortcut={shortcuts} />
								</Box>
							</HStack>
						</Fragment>
					);
				})}
			</FeaturesPanel>
		</Features>
	);
};
