import React, { createContext, FC, PropsWithChildren, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { toaster } from '@components/ui/toaster';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { useTelemetryTracker } from '@features/telemetry';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { VaultControls } from '.';

export const VaultErrorContext = createContext<((error: Error) => void) | null>(null);
export const useVaultError = createContextGetterHook(VaultErrorContext);

export const VaultErrorProvider: FC<PropsWithChildren<{ controls: VaultControls }>> = ({
	controls,
	children,
}) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.vault);
	const telemetry = useTelemetryTracker();

	const handleError = useCallback(
		(error: Error) => {
			console.error(error);
			controls.close();

			toaster.create({
				type: 'error',
				title: t('errors.failedToOpen'),
				description: t('errors.corrupted', {
					name: controls.vault.vault.name,
				}),
			});

			telemetry.track(TELEMETRY_EVENT_NAME.VAULT_OPEN_FAILED);
		},
		[controls, t, telemetry],
	);

	return (
		<VaultErrorContext.Provider value={handleError}>
			{children}
		</VaultErrorContext.Provider>
	);
};
