import React, { useMemo, useState } from 'react';
import { AutoFocusInside } from 'react-focus-lock';
import { useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { z } from 'zod';
import {
	Box,
	ModalBody,
	ModalCloseButton,
	ModalHeader,
	Text,
	VStack,
} from '@chakra-ui/react';
import { PropertiesForm } from '@components/PropertiesForm';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import { useVaultDB } from '@features/App/Vault';
import { useTelemetryTracker } from '@features/telemetry';
import { useModalApi } from '@features/WorkspaceModal/useWorkspaceModal';
import { useStandaloneToast } from '@hooks/useStandaloneToast';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/vaults/hooks';
import { workspacesApi } from '@state/redux/vaults/vaults';
import { shuffleArray } from '@utils/collections/shuffleArray';

import { useWorkspacesList } from './useWorkspacesList';

/**
 * Base schema shape for workspace name validation (without localized messages).
 * Used by WorkspaceSettings to validate the workspace rename form.
 */
export const workspacePropsValidator = z.object({
	name: z.string().trim().min(1),
});

export const WorkspaceCreatePopup = () => {
	const { t: tFeatures } = useTranslation(LOCALE_NAMESPACE.features, {
		keyPrefix: 'workspace.creator',
	});

	const localizedWorkspacePropsValidator = useMemo(
		() =>
			z.object({
				name: z.string().trim().min(1, tFeatures('error.format')),
			}),
		[tFeatures],
	);

	const toast = useStandaloneToast('workspace-creator');

	const telemetry = useTelemetryTracker();
	const dispatch = useAppDispatch();

	const { onClose } = useModalApi();

	const { vaultId } = useWorkspaceData();

	const db = useVaultDB(true);

	const workspacesManager = useMemo(() => new WorkspacesController(db.get()), [db]);

	const { update: updateWorkspaces } = useWorkspacesList();

	const [isPending, setIsPending] = useState(false);

	return (
		<>
			<ModalCloseButton />
			<ModalHeader>
				<Text>{tFeatures('title')}</Text>
			</ModalHeader>
			<ModalBody paddingBottom="1rem">
				<VStack w="100%" gap="2rem" align="start">
					<Text color="typography.secondary">{tFeatures('description')}</Text>

					<Box as={AutoFocusInside} w="100%">
						<PropertiesForm
							options={[
								{
									id: 'name',
									value: '',
									label: tFeatures('field.name.label'),
									placeholder: tFeatures('field.name.placeholder'),
									suggests: shuffleArray(
										Object.values(
											tFeatures('field.name.suggests', {
												returnObjects: true,
											}),
										) as string[],
									).slice(0, 3),
								},
							]}
							validatorScheme={localizedWorkspacePropsValidator}
							onUpdate={({ name }) => {
								if (isPending) return;
								setIsPending(true);

								workspacesManager
									.create({ name })
									.then(async (workspaceId) => {
										// Synchronize immediately after creation to prevent workspace loss
										// if the user closes the app before the automatic sync
										await db.sync();

										await updateWorkspaces();

										dispatch(
											workspacesApi.setActiveWorkspace({
												workspaceId,
												vaultId,
											}),
										);

										telemetry.track(
											TELEMETRY_EVENT_NAME.WORKSPACE_ADDED,
										);

										onClose();
									})
									.catch((error) => {
										console.error(error);
										toast.show({
											description: tFeatures('error.unknown'),
										});
									})
									.finally(() => {
										setIsPending(false);
									});
							}}
							submitButtonText={tFeatures('action.add')}
							cancelButtonText={tFeatures('action.cancel')}
							onCancel={onClose}
							isPending={isPending}
						/>
					</Box>
				</VStack>
			</ModalBody>
		</>
	);
};
