import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaPlus } from 'react-icons/fa6';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Box, HStack, Separator, Text, VStack } from '@chakra-ui/react';
import { IconButton } from '@components/IconButton';
import { TagEditor, TagEditorData } from '@components/TagEditor';
import { IResolvedTag } from '@core/features/tags';
import {
	TAG_ERROR_CODE,
	TagControllerError,
} from '@core/features/tags/controller/TagsController';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { useTagsRegistry } from '@features/App/Workspace/WorkspaceProvider';
import { useTelemetryTracker } from '@features/telemetry';
import { useWorkspaceModal } from '@features/WorkspaceModal/useWorkspaceModal';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/vaults/hooks';
import {
	selectActiveTag,
	selectTags,
	selectTagsTree,
	workspacesApi,
} from '@state/redux/vaults/vaults';

import { TagsList } from './TagsList';

export const TagsPanel = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.workspace);
	const { t: tFeatures } = useTranslation(LOCALE_NAMESPACE.features);
	const telemetry = useTelemetryTracker();

	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();

	const activeTag = useWorkspaceSelector(selectActiveTag);
	const tags = useWorkspaceSelector(selectTags);
	const tagsTree = useWorkspaceSelector(selectTagsTree);

	const tagsRegistry = useTagsRegistry();

	const modal = useWorkspaceModal();

	const getTagEditor = ({
		onClose,
		parentTag,
		editedTag,
	}: {
		onClose: () => void;
		parentTag?: IResolvedTag;
		editedTag?: TagEditorData;
	}) => {
		if (editedTag) {
			const parent = tags.find(({ id }) => id === editedTag.parent);
			return (
				<TagEditor
					tags={tags}
					parentTag={parent}
					editedTag={editedTag}
					onSave={async (data) => {
						try {
							console.warn('Update tag', data);

							if (data.id === undefined)
								throw new Error('Tag ID is required but not found');

							await tagsRegistry.update({ id: data.id, ...data });

							telemetry.track(TELEMETRY_EVENT_NAME.TAG_EDITED, {
								hasParent: data.parent === null ? 'no' : 'yes',
							});

							return { ok: true };
						} catch (error) {
							if (error instanceof TagControllerError) {
								let message: string;
								switch (error.code) {
									case TAG_ERROR_CODE.PARENT_TAG_NOT_EXIST:
										message = tFeatures(
											'tag.editor.messages.parentTagNotFound',
										);
										break;
									case TAG_ERROR_CODE.DUPLICATE:
										message = tFeatures(
											'tag.editor.messages.duplicate',
											{
												name: [parent?.resolvedName, data.name]
													.filter(Boolean)
													.join('/'),
											},
										);
										break;
									default:
										message = tFeatures('tag.editor.messages.format');
								}

								return { ok: false, error: message };
							}

							throw error;
						}
					}}
					onCancel={onClose}
				/>
			);
		}

		return (
			<TagEditor
				tags={tags}
				parentTag={parentTag}
				onSave={async (data) => {
					try {
						console.warn('Create tag', data);
						await tagsRegistry.add(data.name, data.parent);

						telemetry.track(TELEMETRY_EVENT_NAME.TAG_CREATED, {
							scope: 'side panel',
							hasParent: data.parent === null ? 'no' : 'yes',
						});

						return { ok: true };
					} catch (error) {
						if (error instanceof TagControllerError) {
							let message: string;
							switch (error.code) {
								case TAG_ERROR_CODE.PARENT_TAG_NOT_EXIST:
									message = tFeatures(
										'tag.editor.messages.parentTagNotFound',
									);
									break;
								case TAG_ERROR_CODE.DUPLICATE:
									message = tFeatures('tag.editor.messages.duplicate', {
										name: [parentTag?.resolvedName, data.name]
											.filter(Boolean)
											.join('/'),
									});
									break;
								default:
									message = tFeatures('tag.editor.messages.format');
							}

							return { ok: false, error: message };
						}

						throw error;
					}
				}}
				onCancel={onClose}
			/>
		);
	};

	return (
		<>
			<VStack align="normal" w="100%" minHeight="150px" gap=".5rem">
				<HStack w="100%">
					<Text
						as="h2"
						fontSize=".9rem"
						fontWeight="600"
						color="typography.secondary"
					>
						{t('panel.tags.label')}
					</Text>

					<IconButton
						variant="ghost"
						onClick={() => {
							modal.show({
								content: getTagEditor,
							});
						}}
						size="xs"
						marginLeft="auto"
						icon={<FaPlus />}
						title={t('panel.tags.actions.add')}
					/>
				</HStack>

				<Separator />

				<Box w="100%" overflow="auto" paddingInlineEnd=".5rem">
					{tagsTree.length > 0 ? (
						<TagsList
							tags={tagsTree}
							activeTag={activeTag ? activeTag.id : undefined}
							onTagClick={(tagId) =>
								dispatch(
									workspacesApi.setSelectedTag({
										...workspaceData,
										tag: tagId,
									}),
								)
							}
							contextMenu={{
								onAdd(id) {
									const tag = tags.find((tag) => id === tag.id);

									modal.show({
										content: ({ onClose }) =>
											getTagEditor({
												onClose,
												parentTag: tag,
											}),
									});
								},
								async onDelete(id) {
									const tag = tags.find((tag) => id === tag.id);
									if (!tag) return;

									const isConfirmed = confirm(
										tFeatures('tag.deletion.confirm', {
											name: tag.resolvedName,
										}),
									);
									if (!isConfirmed) return;

									await tagsRegistry.delete(id);

									telemetry.track(TELEMETRY_EVENT_NAME.TAG_DELETED);
								},
								onEdit(id) {
									const tag = tags.find((tag) => id === tag.id);

									if (!tag) return;

									const { name, parent } = tag;
									modal.show({
										content: ({ onClose }) =>
											getTagEditor({
												onClose,
												editedTag: {
													id,
													name,
													parent,
												},
											}),
									});
								},
							}}
						/>
					) : (
						<Text color="typography.secondary" fontSize="sm">
							{t('panel.tags.empty')}
						</Text>
					)}
				</Box>
			</VStack>
		</>
	);
};
