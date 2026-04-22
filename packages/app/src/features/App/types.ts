import { VaultSummary } from '@core/storage/VaultsList';

type PickVaultResponse = { status: 'ok' } | { status: 'error'; message: string };

export type OnPickVault = (
	vault: VaultSummary,
	password?: string,
) => Promise<PickVaultResponse>;
