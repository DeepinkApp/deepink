import { useEffect, useState } from 'react';
import z from 'zod';
import { FlexSearchIndex } from '@core/database/flexsearch/FlexSearchIndex';
import { AttachmentsController } from '@core/features/attachments/AttachmentsController';
import { IFilesStorage } from '@core/features/files';
import { FileController } from '@core/features/files/FileController';
import { FilesController } from '@core/features/files/FilesController';
import { RootedFS } from '@core/features/files/RootedFS';
import { StateFile } from '@core/features/files/StateFile';
import { INotesController } from '@core/features/notes/controller';
import { NotesController } from '@core/features/notes/controller/NotesController';
import { NotesTextIndexer } from '@core/features/notes/controller/NotesTextIndexer';
import { NoteVersions } from '@core/features/notes/history/NoteVersions';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { useVaultStorage } from '@features/files';
import { getWorkspaceFilesPath, getWorkspacePath } from '@features/files/paths';
import { useWorkspaceData } from '@state/redux/vaults/hooks';

import { VaultContainer } from '../Vaults/hooks/useVaultContainers';

export type WorkspaceContainer = {
	attachmentsController: AttachmentsController;
	filesController: IFilesStorage;
	filesRegistry: FilesController;
	tagsRegistry: TagsController;
	notesRegistry: INotesController;
	notesHistory: NoteVersions;
	notesIndex: {
		index: FlexSearchIndex;
		controller: NotesTextIndexer;
	};
};

export const useWorkspace = (currentVault: VaultContainer) => {
	const [state, setState] = useState<WorkspaceContainer | null>(null);

	const { workspaceId } = useWorkspaceData();

	const files = useVaultStorage();
	useEffect(() => {
		const db = currentVault.db.get();

		// TODO: index must be destroyed by unmount a workspace. That is privacy threat
		const indexDir = new RootedFS(
			files,
			getWorkspacePath(workspaceId) + '/index/notes',
		);
		const notesIndex = new FlexSearchIndex(indexDir);
		const notes = new NotesController(db, workspaceId, notesIndex);
		const workspaceScopedFiles = new RootedFS(
			files,
			getWorkspaceFilesPath(workspaceId),
		);

		// Setup files
		// TODO: implement methods to close the objects after use
		setState({
			filesController: workspaceScopedFiles,
			attachmentsController: new AttachmentsController(db, workspaceId),
			filesRegistry: new FilesController(db, workspaceScopedFiles, workspaceId),
			tagsRegistry: new TagsController(db, workspaceId),
			notesRegistry: notes,
			notesHistory: new NoteVersions(db, workspaceId),
			notesIndex: {
				index: notesIndex,
				controller: new NotesTextIndexer(
					notes,
					notesIndex,
					new StateFile(
						new FileController('state.json', indexDir),
						z.object({
							updatedAt: z.number().nullable(),
							processedIds: z.string().array(),
						}),
					),
				),
			},
		});
	}, [currentVault, files, workspaceId]);

	// Free resources by unmount
	useEffect(() => {
		if (!state) return;

		return () => {
			state.notesIndex.index.unload().then(() => {
				console.debug(
					`Search index for a workspace ${workspaceId} have been unloaded`,
				);
			});
		};
	}, [state, workspaceId]);

	return state;
};
