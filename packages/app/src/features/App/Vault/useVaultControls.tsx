import { createContext } from 'react';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { VaultContainer } from '../Vaults/hooks/useVaultContainers';

export type VaultControls = {
	vault: VaultContainer;
	close: () => void;
};

export const VaultControlsContext = createContext<VaultControls | null>(null);
export const useVaultControls = createContextGetterHook(VaultControlsContext);
