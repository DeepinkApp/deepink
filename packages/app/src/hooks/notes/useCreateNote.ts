import { useCallback } from 'react';
import {
	useNotesContext,
	useNotesRegistry,
	useTagsRegistry,
} from '@features/App/Workspace/WorkspaceProvider';
import { useLoadedLanguage } from '@hooks/useLocalizedDate';
import { useWorkspaceSelector } from '@state/redux/vaults/hooks';
import { selectActiveTag, selectNewNoteTemplate } from '@state/redux/vaults/vaults';

import { TemplateProcessor } from './TemplateProcessor';
import { useUpdateNotes } from './useUpdateNotes';

export const useCreateNote = () => {
	const language = useLoadedLanguage();
	const notesRegistry = useNotesRegistry();
	const tagsRegistry = useTagsRegistry();

	const activeTag = useWorkspaceSelector(selectActiveTag);
	const newNoteConfig = useWorkspaceSelector(selectNewNoteTemplate);

	const updateNotes = useUpdateNotes();

	const { openNote } = useNotesContext();

	return useCallback(async () => {
		const templates = new TemplateProcessor({ ignoreParsingErrors: true, language });

		const noteId = await notesRegistry.add({
			title: templates.compile(newNoteConfig.title),
			text: '',
		});

		// TODO: attach listed tags if they do exist
		if (newNoteConfig.tags === 'selected' && activeTag) {
			await tagsRegistry.setAttachedTags(noteId, [activeTag.id]);
		}

		await updateNotes();

		const [note] = await notesRegistry.getById([noteId]);
		if (note) {
			openNote(note, { preview: false });
		}
	}, [
		activeTag,
		language,
		newNoteConfig.tags,
		newNoteConfig.title,
		notesRegistry,
		openNote,
		tagsRegistry,
		updateNotes,
	]);
};
