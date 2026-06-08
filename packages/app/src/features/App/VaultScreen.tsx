import React, { FC } from 'react';
import { Box } from '@chakra-ui/react';

import { AppServices } from './AppServices';
import { Vaults } from './Vaults';
import { VaultsApi } from './Vaults/hooks/useVaultContainers';

export const VaultScreen: FC<{ vaultContainers: VaultsApi }> = ({ vaultContainers }) => {
	return (
		<Box
			css={{
				display: 'flex',
				width: '100%',
				height: '100vh',
			}}
		>
			<Vaults vaultsApi={vaultContainers} />
			<AppServices />
		</Box>
	);
};
