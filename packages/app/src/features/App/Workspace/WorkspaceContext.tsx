import { createContext } from 'react';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

export const WorkspaceContext = createContext<{
	workspaceId: string;
	vaultId: string;
} | null>(null);
export const useWorkspaceContext = createContextGetterHook(WorkspaceContext);
