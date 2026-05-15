import { useCallback, useState } from 'react';
import { throttle } from 'lodash';
import { WorkspaceEvents } from '@api/events/workspace';
import { IFilesStorage } from '@core/features/files';
import { NotesImporterConfig, OnProcessedPayload } from '@core/storage/interop/import';
import { NotesImporterWorker } from '@core/storage/interop/import/NotesImporterWorker';
import {
	useAttachmentsController,
	useEventBus,
	useFilesRegistry,
	useNotesHistory,
	useNotesRegistry,
	useTagsRegistry,
} from '@features/App/Workspace/WorkspaceProvider';

// TODO: notify for successful import
export const useNotesImport = ({ snapshots }: { snapshots?: boolean } = {}) => {
	const [importSession, setImportSession] = useState<{
		abortController: AbortController;
		progress: OnProcessedPayload;
	} | null>(null);

	const notesRegistry = useNotesRegistry();
	const tagsRegistry = useTagsRegistry();
	const filesRegistry = useFilesRegistry();
	const attachmentsRegistry = useAttachmentsController();
	const noteVersions = useNotesHistory();

	const eventBus = useEventBus();
	const importNotes = useCallback(
		async (files: IFilesStorage, options: NotesImporterConfig = {}) => {
			const abortController = new AbortController();

			setImportSession({
				abortController,
				progress: {
					stage: 'parsing',
					total: 0,
					processed: 0,
				},
			});

			const onProgress = throttle(setImportSession, 200);

			await new NotesImporterWorker(
				{
					filesRegistry,
					notesRegistry,
					noteVersions: snapshots ? noteVersions : undefined,
					attachmentsRegistry,
					tagsRegistry,
				},
				{
					ignorePaths: ['/_resources'],

					noteExtensions: ['.md', '.mdx'],
					convertPathToTag: 'always',
					...options,
				},
			)
				.import(files, {
					abortSignal: abortController.signal,
					onProcessed(info) {
						console.debug('Import progress', info);
						onProgress((value) =>
							value ? { ...value, progress: info } : value,
						);
					},
				})
				.catch((error) => {
					onProgress.flush();
					setImportSession(null);

					throw error;
				});

			onProgress.flush();
			setImportSession(null);
			eventBus.emit(WorkspaceEvents.NOTES_UPDATED);
		},
		[
			attachmentsRegistry,
			snapshots,
			eventBus,
			filesRegistry,
			noteVersions,
			notesRegistry,
			tagsRegistry,
		],
	);

	// TODO: return promise that will be resolved once import session is ended
	const abortController = importSession?.abortController;
	const abort = useCallback(
		(reason?: any) => {
			if (!abortController) return;
			abortController.abort(reason ?? new Error('Import is aborted by user'));
		},
		[abortController],
	);

	return {
		importNotes,
		progress: importSession?.progress ?? null,
		abort,
	} as const;
};
