import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
	FaBell,
	FaBoxArchive,
	FaClock,
	FaCopy,
	FaEllipsis,
	FaEye,
	FaFileExport,
	FaLink,
	FaRotate,
	FaShield,
	FaSpellCheck,
	FaTrashCan,
	FaTrashCanArrowUp,
} from 'react-icons/fa6';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Button, HStack, Menu, Portal, Text } from '@chakra-ui/react';
import { INote } from '@core/features/notes';
import { GLOBAL_COMMANDS } from '@hooks/commands';
import { useCommand } from '@hooks/commands/useCommand';
import { useVaultSelector } from '@state/redux/vaults/hooks';
import { selectDeletionConfig } from '@state/redux/vaults/selectors/vault';

export const NoteMenu = memo(({ note }: { note: INote }) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);
	const runCommand = useCommand();

	const deletionConfig = useVaultSelector(selectDeletionConfig);

	return (
		<Menu.Root>
			<Menu.Context>
				{({ open: isOpen }) => (
					<>
						<Menu.Trigger asChild>
							<Button
								variant="ghost"
								size="sm"
								title={t('note.menu.title')}
							>
								<FaEllipsis />
							</Button>
						</Menu.Trigger>
						{isOpen && (
							<Portal>
								<Menu.Positioner>
									<Menu.Content>
										<Menu.Item
											onSelect={() =>
												runCommand(
													GLOBAL_COMMANDS.COPY_NOTE_MARKDOWN_LINK,
													{
														noteId: note.id,
													},
												)
											}
											value="copyReference"
										>
											<HStack>
												<FaCopy />
												<Text>
													{t('note.menu.copyReference')}
												</Text>
											</HStack>
										</Menu.Item>
										<Menu.Item value="remindMe">
											<HStack>
												<FaBell />
												<Text>{t('note.menu.remindMe')}</Text>
											</HStack>
										</Menu.Item>
										<Menu.Item
											onSelect={() =>
												runCommand(
													GLOBAL_COMMANDS.TOGGLE_NOTE_HISTORY_PANEL,
													{
														noteId: note.id,
													},
												)
											}
											value="history"
										>
											<HStack>
												<FaClock />
												<Text>{t('note.menu.history')}</Text>
											</HStack>
										</Menu.Item>
										<Menu.Item value="backLinks">
											<HStack>
												<FaLink />
												<Text>{t('note.menu.backLinks')}</Text>
											</HStack>
										</Menu.Item>
										<Menu.Item value="readonlyMode">
											<HStack>
												<FaEye />
												<Text>{t('note.menu.readonlyMode')}</Text>
											</HStack>
										</Menu.Item>
										<Menu.Item value="spellcheck">
											<HStack>
												<FaSpellCheck />
												<Text>{t('note.menu.spellcheck')}</Text>
											</HStack>
										</Menu.Item>
										<Menu.Item
											onSelect={() =>
												runCommand(GLOBAL_COMMANDS.EXPORT_NOTE, {
													noteId: note.id,
												})
											}
											value="export"
										>
											<HStack>
												<FaFileExport />
												<Text>{t('note.menu.export')}</Text>
											</HStack>
										</Menu.Item>
										<Menu.Item value="passwordProtection">
											<HStack>
												<FaShield />
												<Text>
													{t('note.menu.passwordProtection')}
												</Text>
											</HStack>
										</Menu.Item>
										<Menu.Item value="disableSync">
											<HStack>
												<FaRotate />
												<Text>{t('note.menu.disableSync')}</Text>
											</HStack>
										</Menu.Item>
										<Menu.Item
											onSelect={() =>
												runCommand(
													GLOBAL_COMMANDS.TOGGLE_NOTE_ARCHIVE,
													{
														noteId: note.id,
													},
												)
											}
											value="moveToArchive"
										>
											<HStack>
												<FaBoxArchive />
												<Text>
													{note.isArchived
														? t('note.menu.removeFromArchive')
														: t('note.menu.moveToArchive')}
												</Text>
											</HStack>
										</Menu.Item>
										<Menu.Item
											onSelect={() => {
												if (
													deletionConfig.permanentDeletion ||
													note.isDeleted
												) {
													runCommand(
														GLOBAL_COMMANDS.DELETE_NOTE_PERMANENTLY,
														{
															noteId: note.id,
														},
													);
													return;
												}

												runCommand(
													GLOBAL_COMMANDS.MOVE_NOTE_TO_BIN,
													{
														noteId: note.id,
													},
												);
											}}
											value="delete"
										>
											<HStack>
												<FaTrashCan />
												<Text>
													{deletionConfig.permanentDeletion ||
													note.isDeleted
														? t('note.menu.deletePermanently')
														: t('note.menu.deleteToBin')}
												</Text>
											</HStack>
										</Menu.Item>
										{note.isDeleted && (
											<Menu.Item
												onSelect={() =>
													runCommand(
														GLOBAL_COMMANDS.RESTORE_NOTE_FROM_BIN,
														{
															noteId: note.id,
														},
													)
												}
												value="restoreFromBin"
											>
												<HStack>
													<FaTrashCanArrowUp />
													<Text>
														{t('note.menu.restoreFromBin')}
													</Text>
												</HStack>
											</Menu.Item>
										)}
									</Menu.Content>
								</Menu.Positioner>
							</Portal>
						)}
					</>
				)}
			</Menu.Context>
		</Menu.Root>
	);
});
