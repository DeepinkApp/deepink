import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { useAppContextMenu } from '@hooks/useAppContextMenu';
import { MenuPosition } from '@utils/menu/AppContextMenu';

export enum TagContextMenu {
	ADD = 'add',
	EDIT = 'edit',
	DELETE = 'delete',
}

export type TagContextMenuCallbacks = {
	onAdd: (id: string) => void;
	onEdit: (id: string) => void;
	onDelete: (id: string) => void;
};

export const useTagContextMenu = ({
	onAdd,
	onEdit,
	onDelete,
}: TagContextMenuCallbacks) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.menu, { keyPrefix: 'tag' });
	const showMenu = useAppContextMenu();

	return useCallback(
		(id: string, position: MenuPosition) => {
			showMenu(
				[
					{
						id: TagContextMenu.ADD,
						label: t('addNestedTag'),
						click() {
							onAdd(id);
						},
					},
					{
						id: TagContextMenu.EDIT,
						label: t('edit'),
						click() {
							onEdit(id);
						},
					},
					{ type: 'separator' },
					{
						id: TagContextMenu.DELETE,
						label: t('delete'),
						click() {
							onDelete(id);
						},
					},
				],
				position,
			);
		},
		[onAdd, onDelete, onEdit, showMenu, t],
	);
};
