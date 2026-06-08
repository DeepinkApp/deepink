import React, { FC } from 'react';
import { AutoFocusInside } from 'react-focus-lock';
import { useTranslation } from 'react-i18next';
import { FaImage } from 'react-icons/fa6';
import { LOCALE_NAMESPACE } from 'src/i18n';
import {
	Box,
	Button,
	ButtonProps,
	CloseButton,
	Dialog,
	Text,
	VStack,
} from '@chakra-ui/react';
import { PropertiesForm } from '@components/PropertiesForm';
import { useWorkspaceModal } from '@features/WorkspaceModal/useWorkspaceModal';

import { InsertingPayloadMap } from '..';

export const ImageButton: FC<
	ButtonProps & {
		onPick: (payload: InsertingPayloadMap['image']) => void;
	}
> = ({ onPick }) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);
	const { show } = useWorkspaceModal();

	return (
		<>
			<Button
				size="sm"
				variant="ghost"
				title={t('editorPanel.image.buttonTitle')}
				onClick={() => {
					show({
						content: ({ onClose }) => (
							<>
								<Dialog.Header>
									<Dialog.Title>
										{t('editorPanel.image.dialogTitle')}
									</Dialog.Title>
								</Dialog.Header>
								<Dialog.CloseTrigger asChild>
									<CloseButton size="sm" />
								</Dialog.CloseTrigger>
								<Dialog.Body paddingBottom="1rem">
									<VStack w="100%" gap="2rem" align="start">
										<Text variant="secondary">
											{t('editorPanel.image.dialogDescription')}
										</Text>

										<Box w="100%" asChild>
											<AutoFocusInside>
												<PropertiesForm
													options={[
														{
															id: 'url',
															value: '',
															label: t(
																'editorPanel.image.field.url.label',
															),
															placeholder: t(
																'editorPanel.image.field.url.placeholder',
															),
														},
														{
															id: 'altText',
															value: '',
															label: t(
																'editorPanel.image.field.altText.label',
															),
															placeholder: t(
																'editorPanel.image.field.altText.placeholder',
															),
														},
													]}
													onUpdate={({ url, altText }) => {
														onClose();

														if (url) {
															onPick({ url, altText });
														}
													}}
													submitButtonText={t(
														'editorPanel.image.actions.add',
													)}
													cancelButtonText={t(
														'editorPanel.image.actions.cancel',
													)}
													onCancel={onClose}
												/>
											</AutoFocusInside>
										</Box>
									</VStack>
								</Dialog.Body>
							</>
						),
					});
				}}
			>
				<FaImage />
			</Button>
		</>
	);
};
