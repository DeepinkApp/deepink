import { useCallback, useEffect, useState } from 'react';
import z from 'zod';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';
import { useWatchSelector } from '@hooks/useWatchSelector';
import { createAppSelector } from '@state/redux/utils';
import { selectVaultById } from '@state/redux/vaults/vaults';

import { VaultControls } from './useVaultControls';

const vaultStateScheme = z.object({
	activeWorkspace: z.string().nullable(),
});

export const useVaultState = ({
	sync,
	controls: {
		vault: {
			files,
			vault: { id: vaultId },
		},
	},
}: {
	sync: boolean;
	controls: VaultControls;
}) => {
	const [vaultState] = useState(
		() =>
			new StateFile(
				new FileController('state.json', files),
				vaultStateScheme.partial(),
			),
	);

	const watchSelector = useWatchSelector();
	useEffect(() => {
		if (!sync) return;

		return watchSelector({
			selector: createAppSelector(selectVaultById({ vaultId }), (state) => {
				if (!state) return null;

				const { activeWorkspace } = state;

				return { activeWorkspace };
			}),
			onChange(state) {
				if (!state) return;

				vaultState.set(state);
			},
		});
	}, [files, vaultId, sync, vaultState, watchSelector]);

	return useCallback(() => vaultState.get(), [vaultState]);
};
