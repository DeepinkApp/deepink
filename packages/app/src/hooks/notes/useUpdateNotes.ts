import { useCallback, useRef } from 'react';
import {
	useNotesRegistry,
	useWorkspaceContainer,
} from '@features/App/Workspace/WorkspaceProvider';
import { useAppDispatch } from '@state/redux/hooks';
import { useNonReactiveSelector, useWorkspaceActions } from '@state/redux/vaults/hooks';
import { selectNotesView } from '@state/redux/vaults/selectors/view';
import { NOTES_VIEW, selectActiveTag, selectSearch } from '@state/redux/vaults/vaults';

export const useUpdateNotes = () => {
	const dispatch = useAppDispatch();
	const workspacesApi = useWorkspaceActions();
	const select = useNonReactiveSelector();

	const {
		notesIndex: { controller: notesIndexController },
	} = useWorkspaceContainer();

	const notesRegistry = useNotesRegistry();

	const requestContextRef = useRef(0);
	return useCallback(async () => {
		const contextId = ++requestContextRef.current;
		const isRequestCanceled = () => contextId !== requestContextRef.current;

		const notesView = select.workspace(selectNotesView);
		const activeTag = select.workspace(selectActiveTag);
		const searchText = select.workspace(selectSearch).trim();
		if (searchText) {
			console.debug('Notes text indexing...');
			const start = performance.now();
			await notesIndexController.update();

			if (isRequestCanceled()) return;
			console.debug('Notes indexing is completed', performance.now() - start);
		}

		const tags = activeTag !== null ? [activeTag.id] : [];

		const noteIds = await notesRegistry.query({
			tags,
			sort: { by: 'updatedAt', order: 'desc' },
			search: searchText
				? {
						text: searchText,
					}
				: undefined,
			meta: {
				isDeleted: notesView === NOTES_VIEW.BIN,
				// show archived notes only in archive view
				// but do not filter by the archived flag in bin view
				...(notesView !== NOTES_VIEW.BIN && {
					isArchived: notesView === NOTES_VIEW.ARCHIVE,
				}),
				...(notesView === NOTES_VIEW.BOOKMARK && { isBookmarked: true }),
			},
		});

		if (isRequestCanceled()) return;

		dispatch(workspacesApi.setNoteIds({ noteIds }));
	}, [dispatch, notesIndexController, notesRegistry, select, workspacesApi]);
};
