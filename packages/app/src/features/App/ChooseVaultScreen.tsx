import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { FaLock, FaShapes } from 'react-icons/fa6';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Button } from '@chakra-ui/react';
import { ListBox } from '@components/ListBox/ListBox';
import { TextWithIcon } from '@components/TextWithIcon';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { VaultSummary } from '@core/storage/VaultsList';
import { useTelemetryTracker } from '@features/telemetry';
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

	const telemetry = useTelemetryTracker();

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
				<ListBox.Root
					autoFocus
					selectionMode="none"
					onAction={(vaultId) => {
						const vault = vaults.find((vault) => vault.id === vaultId);
						if (!vault) return;

						dispatch(workspacesApi.setActiveVault(vault.id));

						if (!vault.isEncrypted) {
							onOpenVault(vault);
						}

						telemetry.track(TELEMETRY_EVENT_NAME.VAULT_SELECTED);
					}}
					containerProps={{
						maxHeight: '230px',
						overflow: 'auto',
					}}
				>
					{(vaults ?? []).map((vault) => (
						<ListBox.Item
							key={vault.id}
							id={vault.id}
							textValue={vault.name.toLowerCase()}
						>
							<TextWithIcon
								icon={vault.isEncrypted ? <FaLock /> : <FaShapes />}
							>
								{vault.name}
							</TextWithIcon>
						</ListBox.Item>
					))}
				</ListBox.Root>
			</VaultsForm>
		</CenterBox>
	);
};
