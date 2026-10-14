import { createAppSelector } from '@state/redux/utils';

import { selectSettings } from '../settings';
import { normalizeFontFamily } from './utils';

export const selectEditorConfig = createAppSelector(
	selectSettings,
	(settings) => settings.editor,
);

export const selectEditorFontFamily = createAppSelector(
	selectEditorConfig,
	({ fontFamily }) => {
		const fallback = '"Source Serif 4", serif';

		const normalizedFontFamily = normalizeFontFamily(fontFamily);

		if (!normalizedFontFamily) return fallback;
		return `${normalizedFontFamily}, ${fallback}`;
	},
);

export const selectEditorDateFormat = createAppSelector(
	selectEditorConfig,
	({ dateFormat }) => dateFormat,
);

export const selectTheme = createAppSelector(
	selectSettings,
	(settings) => settings.system,
);

export const selectVaultLockConfig = createAppSelector(
	selectSettings,
	(settings) => settings.vaultLock,
);

export const selectIsCheckForUpdatesEnabled = createAppSelector(
	selectSettings,
	(settings) => settings.checkForUpdates,
);

export const selectAppLanguage = createAppSelector(
	selectSettings,
	(settings) => settings.language,
);
