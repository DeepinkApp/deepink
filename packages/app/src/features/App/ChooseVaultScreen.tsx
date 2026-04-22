import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { FaUser } from 'react-icons/fa6';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Button, Divider, HStack, Text } from '@chakra-ui/react';
import { NestedList } from '@components/NestedList';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { VaultSummary } from '@core/storage/VaultsList';
import { telemetry } from '@electron/requests/telemetry/renderer';
import { useAppDispatch } from '@state/redux/hooks';
import { workspacesApi } from '@state/redux/vaults/vaults';

import { CenterBox } from './CenterBox';
import { OnPickVault } from './types';
import { VaultsForm } from './VaultsForm';

export const ChooseVaultScreen: FC<{
	vaults: VaultSummary[];
	onOpenVault: OnPickVault;
	onCreateVault: () => void;
}> = ({ vaults, onOpenVault, onCreateVault }) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.vault);
	const dispatch = useAppDispatch();

	return (
		<CenterBox>
			<VaultsForm
				title={t('chooseVault.title')}
				controls={
					<Button
						variant="accent"
						size="lg"
						w="100%"
						onClick={() => onCreateVault()}
					>
						{t('chooseVault.actions.createNew')}
					</Button>
				}
			>
				<NestedList
					divider={<Divider margin="0px !important" />}
					sx={{
						w: '100%',
						borderRadius: '4px',
						maxHeight: '230px',
						overflow: 'auto',
						border: '1px solid',
					}}
					items={(vaults ?? []).map((vault) => ({
						id: vault.id,
						content: (
							<HStack
								as="button"
								key={vault.id}
								sx={{
									padding: '.8rem 1rem',
									w: '100%',
									cursor: 'pointer',
									gap: '.8rem',
								}}
								onClick={() => {
									dispatch(workspacesApi.setActiveVault(vault.id));

									if (vault.isEncrypted === null) {
										onOpenVault(vault);
									}

									telemetry.track(TELEMETRY_EVENT_NAME.VAULT_SELECTED);
								}}
							>
								<FaUser />
								<Text>{vault.name}</Text>
							</HStack>
						),
					}))}
				/>
			</VaultsForm>
		</CenterBox>
	);
};
