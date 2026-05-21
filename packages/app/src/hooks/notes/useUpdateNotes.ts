import { useCallback, useRef } from 'react';
import {
	useNotesRegistry,
	useWorkspaceContainer,
} from '@features/App/Workspace/WorkspaceProvider';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/vaults/hooks';
import { selectNotesView } from '@state/redux/vaults/selectors/view';
import {
	NOTES_VIEW,
	selectActiveTag,
	selectSearch,
	workspacesApi,
} from '@state/redux/vaults/vaults';

export const useUpdateNotes = () => {
	const dispatch = useAppDispatch();
	const workspaceData = useWorkspaceData();

	const notesView = useWorkspaceSelector(selectNotesView);

	const {
		notesIndex: { controller: notesIndexController },
	} = useWorkspaceContainer();

	const notesRegistry = useNotesRegistry();
	const activeTag = useWorkspaceSelector(selectActiveTag);

	const search = useWorkspaceSelector(selectSearch);

	const requestContextRef = useRef(0);
	return useCallback(async () => {
		const contextId = ++requestContextRef.current;
		const isRequestCanceled = () => contextId !== requestContextRef.current;

		const searchText = search.trim();
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
			sort: [
				...(notesView !== NOTES_VIEW.BIN && searchText.length === 0
					? [{ by: 'pinnedAt', order: 'desc' } as const]
					: []),
				{
					by: 'updatedAt',
					order: 'desc',
				},
			],
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

		dispatch(workspacesApi.setNoteIds({ ...workspaceData, noteIds }));
	}, [
		activeTag,
		dispatch,
		notesIndexController,
		notesRegistry,
		notesView,
		search,
		workspaceData,
	]);
};
