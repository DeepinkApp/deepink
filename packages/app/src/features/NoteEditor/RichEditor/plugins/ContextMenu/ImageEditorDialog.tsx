import React from 'react';
import { MoveFocusInside } from 'react-focus-lock';
import { useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Box, CloseButton, Dialog, VStack } from '@chakra-ui/react';
import { PropertiesForm } from '@components/PropertiesForm';
import { useModalApi } from '@features/WorkspaceModal/useWorkspaceModal';

export const ImageEditorDialog = ({
	url,
	altText,
	onSubmit,
}: {
	url: string;
	altText: string;
	onSubmit: (data: { url: string; altText: string }) => void;
}) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);

	const { onClose } = useModalApi();

	return (
		<>
			<Dialog.Header>
				<Dialog.Title>{t('contextMenu.imageEditor.title')}</Dialog.Title>
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
										label: t(
											'contextMenu.imageEditor.form.url.label',
										),
										placeholder: t(
											'contextMenu.imageEditor.form.url.placeholder',
										),
									},
									{
										id: 'altText',
										value: altText,
										label: t(
											'contextMenu.imageEditor.form.altText.label',
										),
										placeholder: t(
											'contextMenu.imageEditor.form.altText.placeholder',
										),
									},
								]}
								onUpdate={({ url, altText }) => {
									onSubmit({ url, altText });
									onClose();
								}}
								submitButtonText={t(
									'contextMenu.imageEditor.actions.update',
								)}
								onCancel={onClose}
							/>
						</MoveFocusInside>
					</Box>
				</VStack>
			</Dialog.Body>
		</>
	);
};
