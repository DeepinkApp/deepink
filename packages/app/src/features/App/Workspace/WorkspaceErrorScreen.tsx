import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Button, Divider, HStack, Input, Select, Text, VStack } from '@chakra-ui/react';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import { useTelemetryTracker } from '@features/telemetry';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import {
	selectActiveWorkspaceInfo,
	selectWorkspacesInfo,
	workspacesApi,
} from '@state/redux/vaults/vaults';

import { CenterBox } from '../CenterBox';
import { useVaultControls } from '../Vault';

export const WorkspaceErrorScreen = ({
	onWorkspaceErrorReset,
}: {
	onWorkspaceErrorReset: (workspaceId: string) => void;
}) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);
	const dispatch = useAppDispatch();
	const telemetry = useTelemetryTracker();
	const {
		close: vaultClose,
		vault: {
			db,
			vault: { id: vaultId },
		},
	} = useVaultControls();

	const workspaces = useAppSelector(selectWorkspacesInfo({ vaultId }));
	const currentWorkspace = useAppSelector(selectActiveWorkspaceInfo({ vaultId }));

	const [newWorkspaceName, setNewWorkspaceName] = useState('');
	const rawDB = db.get();
	const workspacesManager = useMemo(() => new WorkspacesController(rawDB), [rawDB]);
	const [isPending, setIsPending] = useState(false);

	if (!currentWorkspace) return;

	return (
		<CenterBox>
			<VStack maxW="400px" minW="350px" gap="2rem">
				<Text fontSize="1.3rem" fontWeight="bold">
					{t('workspace.error.title', { name: currentWorkspace.name })}
				</Text>

				<Text color="typography.base">{t('workspace.error.description')}</Text>

				<VStack
					alignItems="start"
					w="100%"
					color="typography.additional"
					gap="0.5rem"
				>
					<Text>{t('workspace.error.chooseAnother')}</Text>

					<Select
						size="md"
						marginTop="auto"
						borderRadius="6px"
						value={currentWorkspace.id}
						onChange={(evt) => {
							onWorkspaceErrorReset(currentWorkspace.id);

							const workspaceId = evt.target.value;
							dispatch(
								workspacesApi.setActiveWorkspace({
									vaultId,
									workspaceId,
								}),
							);

							telemetry.track(TELEMETRY_EVENT_NAME.WORKSPACE_SELECTED, {
								totalWorkspacesCount: workspaces.length,
							});
						}}
					>
						{workspaces.map((workspace) => (
							<option key={workspace.id} value={workspace.id}>
								{workspace.name}
							</option>
						))}
					</Select>
				</VStack>

				<HStack w="100%">
					<Divider />
					<Text paddingInline=".5rem">{t('workspace.error.dividerText')}</Text>
					<Divider />
				</HStack>

				<VStack
					alignItems="start"
					w="100%"
					color="typography.additional"
					gap="0.5rem"
				>
					<Text>{t('workspace.error.createNew')}</Text>
					<form
						style={{ width: '100%' }}
						onSubmit={(event) => {
							event.preventDefault();
							if (isPending || !newWorkspaceName.trim()) return;

							setIsPending(true);

							workspacesManager
								.create({ name: newWorkspaceName })
								.then(async (workspaceId) => {
									await db.sync();

									const updatedWorkspaces =
										await workspacesManager.getList();
									dispatch(
										workspacesApi.updateWorkspacesList({
											vaultId,
											workspaces: updatedWorkspaces,
											newNoteTemplate: t(
												'note.title.defaultTemplate',
												{ date: '{date:D MMM YYYY, HH:mm}' },
											),
										}),
									);

									onWorkspaceErrorReset(currentWorkspace.id);

									dispatch(
										workspacesApi.setActiveWorkspace({
											workspaceId,
											vaultId,
										}),
									);

									telemetry.track(TELEMETRY_EVENT_NAME.WORKSPACE_ADDED);
								})
								.finally(() => {
									setIsPending(false);
								});
						}}
					>
						<VStack w="100%">
							<Input
								placeholder={t('workspace.creator.field.name.label')}
								isDisabled={isPending}
								value={newWorkspaceName}
								onChange={(e) => setNewWorkspaceName(e.target.value)}
							/>
							<Button w="100%" isDisabled={isPending} type="submit">
								{t('workspace.error.createWorkspace')}
							</Button>
						</VStack>
					</form>
				</VStack>

				<HStack w="100%">
					<Divider />
					<Text paddingInline=".5rem">{t('workspace.error.dividerText')}</Text>
					<Divider />
				</HStack>

				<VStack
					alignItems="start"
					w="100%"
					gap="0.5rem"
					color="typography.additional"
				>
					<Button w="100%" onClick={() => vaultClose()}>
						<Text>{t('workspace.error.closeVault')}</Text>
					</Button>
				</VStack>
			</VStack>
		</CenterBox>
	);
};
