import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useWorkspaceActions } from '@state/redux/vaults/hooks';

import { ContextMenuBuilder } from './types';

export const useSelectionMenu = (): ContextMenuBuilder => {
	const { setSearch } = useWorkspaceActions();
	const dispatch = useDispatch();

	return useCallback<ContextMenuBuilder>(
		(context) => {
			const searchText = context.selectedText.trim();
			if (!searchText) return [];

			return [
				{
					label: `Search for "${searchText.slice(0, 15)}"`,
					click() {
						dispatch(setSearch({ search: searchText }));
					},
				},
			];
		},
		[dispatch, setSearch],
	);
};
