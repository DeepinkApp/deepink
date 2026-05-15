import { Endpoint, expose } from 'comlink';
import { ComlinkWorkerFS } from '@core/features/files/ComlinkFS';

import { registerDeepObjectTransferHandler } from '../../../../utils/comlink/deepSerialize';

import { NotesImporter, NotesImporterWorkerAPI } from '.';

console.log('Worker is loaded');

registerDeepObjectTransferHandler();

expose(
	{
		async import(deps, files, { config, options } = {}) {
			await new NotesImporter(deps, config).import(
				new ComlinkWorkerFS(files),
				options,
			);
		},
	} satisfies NotesImporterWorkerAPI,
	self as Endpoint,
);
