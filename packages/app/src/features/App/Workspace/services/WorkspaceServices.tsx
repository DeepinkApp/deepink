import { useEffect } from 'react';
import { useUpdateNotes } from '@hooks/notes/useUpdateNotes';
import { useWorkspaceSelector } from '@state/redux/vaults/hooks';
import { selectNotesView } from '@state/redux/vaults/selectors/view';
import { selectActiveTag, selectSearch } from '@state/redux/vaults/vaults';

import { useWorkspaceConfigSync } from './useWorkspaceConfigSync';
import { useWorkspaceStateSync } from './useWorkspaceStateSync';

const useWorkspaceNotesListSync = () => {
	const notesView = useWorkspaceSelector(selectNotesView);
	const activeTag = useWorkspaceSelector(selectActiveTag);
	const search = useWorkspaceSelector(selectSearch);

	const updateNotes = useUpdateNotes();
	useEffect(() => {
		updateNotes();
	}, [notesView, activeTag, search, updateNotes]);
};

export const WorkspaceServices = () => {
	useWorkspaceConfigSync();
	useWorkspaceStateSync();

	useWorkspaceNotesListSync();

	return null;
};
