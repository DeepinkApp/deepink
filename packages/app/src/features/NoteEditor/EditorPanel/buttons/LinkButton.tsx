import React, { FC } from 'react';
import { AutoFocusInside } from 'react-focus-lock';
import { useTranslation } from 'react-i18next';
import { FaLink } from 'react-icons/fa6';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Box, Button, ButtonProps, Dialog, Text, VStack } from '@chakra-ui/react';
import { PropertiesForm } from '@components/PropertiesForm';
import { useWorkspaceModal } from '@features/WorkspaceModal/useWorkspaceModal';

import { InsertingPayloadMap } from '..';

export const LinkButton: FC<
	ButtonProps & {
		onPick: (payload: InsertingPayloadMap['link']) => void;
	}
> = ({ onPick }) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);
	const { show } = useWorkspaceModal();

	return (
		<>
			<Button
				size="sm"
				variant="ghost"
				title={t('editorPanel.link.buttonTitle')}
				onClick={() => {
					show({
						content: ({ onClose }) => (
							<>
								<Dialog.CloseTrigger />
								<Dialog.Header>
									<Text>{t('editorPanel.link.dialogTitle')}</Text>
								</Dialog.Header>
								<Dialog.Body paddingBottom="1rem">
									<VStack w="100%" gap="2rem" align="start">
										<Text variant="secondary">
											{t('editorPanel.link.dialogDescription')}
										</Text>

										<Box w="100%" asChild>
											<AutoFocusInside>
												<PropertiesForm
													options={[
														{
															id: 'url',
															value: '',
															label: t(
																'editorPanel.link.field.url.label',
															),
															placeholder: t(
																'editorPanel.link.field.url.placeholder',
															),
														},
													]}
													onUpdate={({ url }) => {
														onClose();

														if (url) {
															onPick({ url });
														}
													}}
													submitButtonText={t(
														'editorPanel.link.actions.add',
													)}
													cancelButtonText={t(
														'editorPanel.link.actions.cancel',
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
				<FaLink />
			</Button>
		</>
	);
};
