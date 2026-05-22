import React, { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import {
	Button,
	HStack,
	Input,
	Link,
	NativeSelect,
	Separator,
	Text,
	VStack,
} from '@chakra-ui/react';
import { Features } from '@components/Features/Features';
import { FeaturesGroup } from '@components/Features/Group';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';
import { RelaxedInput } from '@components/RelaxedInput';
import { FilesIntegrityController } from '@core/features/integrity/FilesIntegrityController';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { WorkspacesController } from '@core/features/workspaces/WorkspacesController';
import { useVaultStorage } from '@features/files';
import { getWorkspacePath } from '@features/files/paths';
import { useWorkspacesList } from '@features/MainScreen/WorkspacesPanel/useWorkspacesList';
import {
	WorkspaceCreatePopup,
	workspacePropsValidator,
} from '@features/MainScreen/WorkspacesPanel/WorkspaceCreatePopup';
import { useTelemetryTracker } from '@features/telemetry';
import { useWorkspaceModal } from '@features/WorkspaceModal/useWorkspaceModal';
import { zodResolver } from '@hookform/resolvers/zod';
import { TemplateProcessor } from '@hooks/notes/TemplateProcessor';
import { useImportNotesPreset } from '@hooks/notes/useImportNotesPreset';
import { useLoadedLanguage } from '@hooks/useLocalizedDate';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/vaults/hooks';
import {
	selectNewNoteTemplate,
	selectWorkspace,
	selectWorkspaceName,
	workspacesApi,
} from '@state/redux/vaults/vaults';

import { useVaultDB } from '../../Vault';
import {
	useAttachmentsController,
	useFilesController,
	useFilesRegistry,
	useNotesRegistry,
	useTagsRegistry,
} from '../../Workspace/WorkspaceProvider';

export const WorkspaceSettings = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.settings);
	const language = useLoadedLanguage();

	const newNoteConfig = useWorkspaceSelector(selectNewNoteTemplate);

	const telemetry = useTelemetryTracker();

	const db = useVaultDB();

	const { abort: abortImport } = useImportNotesPreset();

	const workspacesManager = useMemo(() => new WorkspacesController(db), [db]);

	const workspaceInfo = useWorkspaceSelector(selectWorkspaceName);

	const currentWorkspace = useWorkspaceData();
	const workspaceData = useAppSelector(selectWorkspace(currentWorkspace));

	const workspaceNameForm = useForm({
		defaultValues: {
			name: workspaceData?.name ?? '',
		},
		resolver: zodResolver(workspacePropsValidator),
	});

	const dispatch = useAppDispatch();
	const workspaces = useWorkspacesList();

	const notes = useNotesRegistry();
	const tags = useTagsRegistry();
	const files = useFilesRegistry();
	const filesController = useFilesController();
	const attachments = useAttachmentsController();
	const workspaceFiles = useVaultStorage(
		getWorkspacePath(currentWorkspace.workspaceId),
	);

	const isOtherWorkspacesExists = workspaces.workspaces.length > 1;
	const onDelete = useCallback(async () => {
		const nextWorkspace = workspaces.workspaces.find(
			(workspace) => workspace.id !== currentWorkspace.workspaceId,
		);
		if (!nextWorkspace) return;

		const isConfirmed = confirm(
			t('workspace.dangerousZone.confirmDelete', { name: workspaceInfo.name }),
		);

		telemetry.track(TELEMETRY_EVENT_NAME.WORKSPACE_DELETE_CLICK, {
			confirmed: isConfirmed ? 'yes' : 'no',
		});
		if (!isConfirmed) return;

		// TODO: emit event and react on it
		// Abort any operations in workspace
		abortImport(new Error('Workspace deletion is in progress'));

		const tagsList = await tags.getTags();
		const notesList = await notes.get();

		await notes.delete(notesList.map((note) => note.id));
		await Promise.all(tagsList.map((note) => tags.delete(note.id)));

		await files
			.query()
			.then((filesList) => files.delete(filesList.map((file) => file.id)));
		await filesController.delete([currentWorkspace.workspaceId]);

		await new FilesIntegrityController(filesController, {
			files,
			attachments,
		}).fixAll();

		// Delete workspace directory
		await workspaceFiles.delete(['/']);

		dispatch(
			workspacesApi.setActiveWorkspace({
				workspaceId: nextWorkspace.id,
				vaultId: currentWorkspace.vaultId,
			}),
		);

		await workspacesManager.delete([currentWorkspace.workspaceId]);
		await workspaces.update();
	}, [
		workspaces,
		workspaceInfo.name,
		t,
		telemetry,
		abortImport,
		tags,
		notes,
		files,
		filesController,
		currentWorkspace.workspaceId,
		currentWorkspace.vaultId,
		attachments,
		workspaceFiles,
		dispatch,
		workspacesManager,
	]);

	const modal = useWorkspaceModal();

	return (
		<Features>
			<FeaturesGroup>
				<FeaturesOption title={t('workspace.name.title')}>
					<HStack asChild>
						<form
							onSubmit={workspaceNameForm.handleSubmit(async ({ name }) => {
								if (!workspaceData) return;

								await workspacesManager.update(workspaceData.id, {
									name,
								});

								await workspaces.update();
							})}
						>
							<Input
								{...workspaceNameForm.register('name')}
								placeholder="e.g., Personal"
								flex="100"
								size="sm"
							/>
							<Button variant={'accent' as any} type="submit" size="sm">
								{t('workspace.name.update')}
							</Button>
						</form>
					</HStack>
					{workspaceNameForm.formState.errors.name && (
						<Text color="message.error">
							{workspaceNameForm.formState.errors.name.message}
						</Text>
					)}
				</FeaturesOption>

				<Separator />

				<FeaturesOption
					title={t('workspace.newNoteTitle.title')}
					description={
						<Trans
							i18nKey="workspace.newNoteTitle.description"
							ns={LOCALE_NAMESPACE.settings}
							components={{
								formatLink: (
									<Link href="https://day.js.org/docs/en/display/format">
										{t('workspace.newNoteTitle.formatReference')}
									</Link>
								),
							}}
						/>
					}
				>
					<RelaxedInput
						size="sm"
						placeholder={t('workspace.newNoteTitle.placeholder')}
						value={newNoteConfig.title}
						onValueChange={(value) => {
							dispatch(
								workspacesApi.setWorkspaceNoteTemplateConfig({
									...currentWorkspace,
									title: value,
								}),
							);
						}}
					/>

					{newNoteConfig.title.trim().length > 0 && (
						<VStack align="start" gap={0} maxWidth="100%">
							<Text fontSize=".8rem">
								{t('workspace.newNoteTitle.example')}
							</Text>
							<Text fontWeight="bold" maxWidth="100%">
								{new TemplateProcessor({
									ignoreParsingErrors: true,
									language,
								}).compile(newNoteConfig.title)}
							</Text>
						</VStack>
					)}
				</FeaturesOption>
				<FeaturesOption title={t('workspace.tagsForNewNote.title')}>
					<NativeSelect.Root size="sm">
						<NativeSelect.Field
							width="auto"
							value={newNoteConfig.tags}
							onChange={(evt) => {
								const { value } = evt.target;
								if (value === 'none' || value === 'selected') {
									dispatch(
										workspacesApi.setWorkspaceNoteTemplateConfig({
											...currentWorkspace,
											tags: value,
										}),
									);
								}
							}}
						>
							<option value="none">
								{t('workspace.tagsForNewNote.none')}
							</option>
							<option value="selected">
								{t('workspace.tagsForNewNote.selected')}
							</option>
						</NativeSelect.Field>
						<NativeSelect.Indicator />
					</NativeSelect.Root>
				</FeaturesOption>
			</FeaturesGroup>
			<FeaturesGroup title={t('workspace.dangerousZone.groupTitle')}>
				<FeaturesOption description={t('workspace.dangerousZone.delete.label')}>
					<Button
						size="sm"
						variant={'accent' as any}
						colorPalette="alert"
						onClick={onDelete}
						disabled={!isOtherWorkspacesExists}
					>
						{t('workspace.dangerousZone.delete.action')}
					</Button>

					{!isOtherWorkspacesExists && (
						<Text>
							{t('workspace.dangerousZone.delete.cannotDeleteLast')}{' '}
							<Link
								href="#"
								onClick={() => {
									modal.show({
										content: () => <WorkspaceCreatePopup />,
									});
								}}
							>
								{t('workspace.dangerousZone.delete.createAnother')}
							</Link>{' '}
							{t('workspace.dangerousZone.delete.createAnotherSuffix')}
						</Text>
					)}
				</FeaturesOption>
			</FeaturesGroup>
		</Features>
	);
};
