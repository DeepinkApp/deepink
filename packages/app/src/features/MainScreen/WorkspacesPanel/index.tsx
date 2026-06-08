import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaPlus } from 'react-icons/fa6';
import { isEqual } from 'lodash';
import { createSelector } from 'reselect';
import { LOCALE_NAMESPACE } from 'src/i18n';
import {
	HStack,
	NativeSelect,
	Separator,
	StackProps,
	Text,
	VStack,
} from '@chakra-ui/react';
import { IconButton } from '@components/IconButton';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { useTelemetryTracker } from '@features/telemetry';
import { useWorkspaceModal } from '@features/WorkspaceModal/useWorkspaceModal';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/vaults/hooks';
import { selectWorkspaces, workspacesApi } from '@state/redux/vaults/vaults';

import { WorkspaceCreatePopup } from './WorkspaceCreatePopup';

export const WorkspacesPanel = (props: StackProps) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.workspace);

	const telemetry = useTelemetryTracker();

	const dispatch = useAppDispatch();

	const { vaultId, workspaceId } = useWorkspaceData();

	const selectWorkspacesWithMemo = useMemo(
		() =>
			createSelector([selectWorkspaces({ vaultId })], (workspaces) =>
				workspaces.map((workspace) => ({
					id: workspace.id,
					content: workspace.name,
				})),
			),
		[vaultId],
	);
	const workspaces = useAppSelector(selectWorkspacesWithMemo, isEqual);

	const modal = useWorkspaceModal();

	return (
		<VStack align="normal" w="100%" gap=".5rem" {...props}>
			<HStack w="100%">
				<Text
					as="h2"
					fontSize=".9rem"
					fontWeight="600"
					gap=".4rem"
					variant="secondary"
				>
					{t('panel.workspaces.label')}
				</Text>

				<IconButton
					variant="ghost"
					size="xs"
					marginLeft="auto"
					onClick={() => {
						modal.show({
							content: () => <WorkspaceCreatePopup />,
						});
					}}
					icon={<FaPlus />}
					title={t('panel.workspaces.actions.add')}
				/>
			</HStack>

			<Separator />

			<HStack w="100%" marginTop="auto">
				<NativeSelect.Root size="sm">
					<NativeSelect.Field
						borderRadius="6px"
						value={workspaceId}
						onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
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
								{workspace.content}
							</option>
						))}
					</NativeSelect.Field>
					<NativeSelect.Indicator />
				</NativeSelect.Root>
			</HStack>
		</VStack>
	);
};
