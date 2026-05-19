import { hasElectronApi } from '@electron/utils/renderer';

import { ipcRendererFetcher } from '../../utils/ipc/ipcRendererFetcher';

import { interopChannel } from '.';

const api = interopChannel.client(ipcRendererFetcher);

export const { getFontsList, getAppLanguage } = api;

export const setAppLanguage = async (language: string) => {
	if (hasElectronApi()) return api.setAppLanguage(language);
};
