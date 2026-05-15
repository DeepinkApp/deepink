import { proxy, wrap } from 'comlink';
import { IFilesStorage } from '@core/features/files';
import { ComlinkHostFS } from '@core/features/files/ComlinkFS';

import {
	deepObject,
	registerDeepObjectTransferHandler,
} from '../../../../utils/comlink/deepSerialize';

import {
	NotesImporterConfig,
	NotesImporterDeps,
	NotesImporterWorkerAPI,
	NotesImportOptions,
} from '.';

export class NotesImporterWorker {
	constructor(
		private readonly deps: NotesImporterDeps,
		private readonly config: NotesImporterConfig,
	) {}

	async import(files: IFilesStorage, options: NotesImportOptions = {}) {
		registerDeepObjectTransferHandler();

		const worker = new Worker(
			/* webpackChunkName: "NotesImporter.worker" */ new URL(
				'./NotesImporter.worker',
				import.meta.url,
			),
			{ type: 'module' },
		);

		try {
			const api = wrap<NotesImporterWorkerAPI>(worker);

			const {
				notesRegistry,
				noteVersions,
				tagsRegistry,
				filesRegistry,
				attachmentsRegistry,
			} = this.deps;

			await api.import(
				deepObject({
					notesRegistry: notesRegistry,
					noteVersions: noteVersions ? noteVersions : undefined,
					tagsRegistry: tagsRegistry,
					filesRegistry: filesRegistry,
					attachmentsRegistry: attachmentsRegistry,
				}),
				proxy(new ComlinkHostFS(files)),
				deepObject({
					config: this.config,
					options,
				}),
			);
		} finally {
			worker.terminate();
		}
	}
}
