import React from 'react';
import { MoveFocusInside } from 'react-focus-lock';
import { useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Box, CloseButton, Dialog, VStack } from '@chakra-ui/react';
import { PropertiesForm } from '@components/PropertiesForm';
import { useModalApi } from '@features/WorkspaceModal/useWorkspaceModal';

export const LinkEditorDialog = ({
	url,
	title,
	onSubmit,
	isInsertionMode,
}: {
	url: string;
	title: string;
	onSubmit: (data: { url: string; title: string }) => void;
	isInsertionMode?: boolean;
}) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);

	const { onClose } = useModalApi();

	return (
		<>
			<Dialog.Header>
				<Dialog.Title>
					{isInsertionMode
						? t('contextMenu.linkEditor.title.add')
						: t('contextMenu.linkEditor.title.edit')}
				</Dialog.Title>
			</Dialog.Header>
			<Dialog.CloseTrigger asChild>
				<CloseButton size="sm" />
			</Dialog.CloseTrigger>
			<Dialog.Body paddingBottom="1rem">
				<VStack w="100%" gap="2rem" align="start">
					<Box w="100%" asChild>
						<MoveFocusInside>
							<PropertiesForm
								options={[
									{
										id: 'url',
										value: url,
										label: t('contextMenu.linkEditor.form.url.label'),
										placeholder: t(
											'contextMenu.linkEditor.form.url.placeholder',
										),
									},
									{
										id: 'title',
										value: title,
										label: t(
											'contextMenu.linkEditor.form.title.label',
										),
										placeholder: t(
											'contextMenu.linkEditor.form.title.placeholder',
										),
									},
								]}
								onUpdate={({ url, title }) => {
									onSubmit({ url, title });
									onClose();
								}}
								submitButtonText={
									isInsertionMode
										? t('contextMenu.linkEditor.actions.insert')
										: t('contextMenu.linkEditor.actions.update')
								}
								onCancel={onClose}
							/>
						</MoveFocusInside>
					</Box>
				</VStack>
			</Dialog.Body>
		</>
	);
};
