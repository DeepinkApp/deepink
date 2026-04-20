import { getPreferredLanguage } from 'src/i18n';
import z from 'zod';
import { accentColorsMap } from '@features/accentColorsMap';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { createAppSelector } from '../utils';

export type EditorMode = 'plaintext' | 'richtext' | 'split-screen';

export const settingsScheme = z.object({
	language: z.string(),
	checkForUpdates: z.boolean(),
	theme: z.object({
		name: z.union([
			z.literal('auto'),
			z.literal('light'),
			z.literal('dark'),
			z.literal('zen'),
		]),
		accentColor: z.string().optional(),
	}),

	editor: z.object({
		mode: z.union([
			z.literal('plaintext'),
			z.literal('richtext'),
			z.literal('split-screen'),
		]),
		fontFamily: z.string(),
		fontSize: z.number(),
		lineHeight: z.number(),
		miniMap: z.boolean(),
		lineNumbers: z.boolean(),
		dateFormat: z.string(),
	}),

	vaultLock: z.object({
		lockAfterIdle: z.number().nullable(),
		lockOnSystemLock: z.boolean(),
	}),
});

export type GlobalSettings = z.output<typeof settingsScheme>;

export const defaultSettings = {
	language: getPreferredLanguage(navigator.languages),
	checkForUpdates: true,
	theme: {
		name: 'zen',
		accentColor: 'auto',
	},
	editor: {
		mode: 'richtext',
		fontFamily: '',
		fontSize: 16,
		lineHeight: 1.6,
		miniMap: false,
		lineNumbers: false,
		dateFormat: 'D MMM YYYY, HH:mm',
	},
	vaultLock: {
		lockAfterIdle: null,
		lockOnSystemLock: false,
	},
} satisfies GlobalSettings as GlobalSettings;

export const settingsSlice = createSlice({
	name: 'settings',
	initialState: defaultSettings,
	reducers: {
		setSettings: (state, { payload }: PayloadAction<Partial<GlobalSettings>>) => {
			return { ...state, ...payload } as GlobalSettings;
		},

		setLanguage: (state, { payload }: PayloadAction<GlobalSettings['language']>) => {
			state.language = payload;
		},

		setEditorMode: (
			state,
			{ payload }: PayloadAction<GlobalSettings['editor']['mode']>,
		) => {
			state.editor.mode = payload;
		},
		setEditorConfig: (
			state,
			{ payload }: PayloadAction<Partial<GlobalSettings['editor']>>,
		) => {
			state.editor = { ...state.editor, ...payload };
		},

		setTheme: (
			state,
			{ payload }: PayloadAction<Partial<GlobalSettings['theme']>>,
		) => {
			const theme = { ...state.theme, ...payload };
			if (!theme.accentColor || !(theme.accentColor in accentColorsMap)) {
				theme.accentColor = 'auto';
			}

			return { ...state, theme } as GlobalSettings;
		},

		setVaultLockConfig: (
			state,
			{ payload }: PayloadAction<Partial<GlobalSettings['vaultLock']>>,
		) => {
			state.vaultLock = {
				...state.vaultLock,
				...payload,
			};
		},

		setCheckForUpdates: (
			state,
			{ payload }: PayloadAction<Partial<GlobalSettings['checkForUpdates']>>,
		) => {
			state.checkForUpdates = payload;
		},
	},
});

export const settingsApi = settingsSlice.actions;

export const selectSettings = settingsSlice.selectSlice;

export const selectEditorMode = createAppSelector(
	selectSettings,
	(settings) => settings.editor.mode,
);

export const selectTheme = createAppSelector(
	selectSettings,
	(settings) => settings.theme,
);
