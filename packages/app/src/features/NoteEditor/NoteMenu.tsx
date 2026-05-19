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
import {
	Button,
	HStack,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	Text,
} from '@chakra-ui/react';
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
		<Menu>
			<MenuButton
				as={Button}
				variant="ghost"
				size="sm"
				title={t('note.menu.title')}
			>
				<FaEllipsis />
			</MenuButton>
			<MenuList>
				<MenuItem
					onClick={() =>
						runCommand(GLOBAL_COMMANDS.COPY_NOTE_MARKDOWN_LINK, {
							noteId: note.id,
						})
					}
				>
					<HStack>
						<FaCopy />
						<Text>{t('note.menu.copyReference')}</Text>
					</HStack>
				</MenuItem>
				<MenuItem>
					<HStack>
						<FaBell />
						<Text>{t('note.menu.remindMe')}</Text>
					</HStack>
				</MenuItem>
				<MenuItem
					onClick={() =>
						runCommand(GLOBAL_COMMANDS.TOGGLE_NOTE_HISTORY_PANEL, {
							noteId: note.id,
						})
					}
				>
					<HStack>
						<FaClock />
						<Text>{t('note.menu.history')}</Text>
					</HStack>
				</MenuItem>
				<MenuItem>
					<HStack>
						<FaLink />
						<Text>{t('note.menu.backLinks')}</Text>
					</HStack>
				</MenuItem>
				<MenuItem>
					<HStack>
						<FaEye />
						<Text>{t('note.menu.readonlyMode')}</Text>
					</HStack>
				</MenuItem>
				<MenuItem>
					<HStack>
						<FaSpellCheck />
						<Text>{t('note.menu.spellcheck')}</Text>
					</HStack>
				</MenuItem>

				<MenuItem
					onClick={() =>
						runCommand(GLOBAL_COMMANDS.EXPORT_NOTE, { noteId: note.id })
					}
				>
					<HStack>
						<FaFileExport />
						<Text>{t('note.menu.export')}</Text>
					</HStack>
				</MenuItem>
				<MenuItem>
					<HStack>
						<FaShield />
						<Text>{t('note.menu.passwordProtection')}</Text>
					</HStack>
				</MenuItem>
				<MenuItem>
					<HStack>
						<FaRotate />
						<Text>{t('note.menu.disableSync')}</Text>
					</HStack>
				</MenuItem>
				<MenuItem
					onClick={() =>
						runCommand(GLOBAL_COMMANDS.TOGGLE_NOTE_ARCHIVE, {
							noteId: note.id,
						})
					}
				>
					<HStack>
						<FaBoxArchive />
						<Text>
							{note.isArchived
								? t('note.menu.removeFromArchive')
								: t('note.menu.moveToArchive')}
						</Text>
					</HStack>
				</MenuItem>
				<MenuItem
					onClick={() => {
						if (deletionConfig.permanentDeletion || note.isDeleted) {
							runCommand(GLOBAL_COMMANDS.DELETE_NOTE_PERMANENTLY, {
								noteId: note.id,
							});
							return;
						}

						runCommand(GLOBAL_COMMANDS.MOVE_NOTE_TO_BIN, {
							noteId: note.id,
						});
					}}
				>
					<HStack>
						<FaTrashCan />
						<Text>
							{deletionConfig.permanentDeletion || note.isDeleted
								? t('note.menu.deletePermanently')
								: t('note.menu.deleteToBin')}
						</Text>
					</HStack>
				</MenuItem>
				{note.isDeleted && (
					<MenuItem
						onClick={() =>
							runCommand(GLOBAL_COMMANDS.RESTORE_NOTE_FROM_BIN, {
								noteId: note.id,
							})
						}
					>
						<HStack>
							<FaTrashCanArrowUp />
							<Text>{t('note.menu.restoreFromBin')}</Text>
						</HStack>
					</MenuItem>
				)}
			</MenuList>
		</Menu>
	);
});
