import { AsyncState } from '@core/features/files/AsyncState';

import { FlexSearchIndex } from '../../../database/flexsearch/FlexSearchIndex';

import { INotesController } from '.';

/**
 * Build and maintain the notes text index
 */
export class NotesTextIndexer {
	constructor(
		private readonly notes: INotesController,
		private readonly index: FlexSearchIndex,
		private readonly state: AsyncState<{
			updatedAt: number | null;
			processedIds: string[];
		}>,
		private readonly config: {
			/**
			 * How much notes to handle in one iteration
			 */
			chunkSize?: number;
		} = {},
	) {}

	// TODO: consider imported notes that have update time before creation time
	// TODO: use UTC time everywhere. Currently we start from a time based on locale time zone
	public async update() {
		const { chunkSize = 1000 } = this.config;
		const index = await this.index.createIndexSession();

		let notesProcessed = 0;

		const initState = await this.state
			.get()
			.then((state) => state ?? { updatedAt: null, processedIds: [] });
		const startDate: Date | null =
			initState.updatedAt !== null ? new Date(initState.updatedAt) : null;
		const processedTimeToIdsMap: Record<number, Set<string>> = {};
		if (initState.updatedAt !== null && initState.processedIds.length > 0) {
			processedTimeToIdsMap[initState.updatedAt] = new Set(initState.processedIds);
		}

		// eslint-disable-next-line no-constant-condition
		for (let page = 1; true; page++) {
			// Take notes chunk
			const notes = await this.notes
				.get({
					sort: [{ by: 'updatedAt', order: 'asc' }],
					updatedAt: { from: startDate ?? undefined },
					limit: chunkSize,
					page,
				})
				.then((notes) =>
					notes.filter(
						(note) =>
							!note.updatedTimestamp ||
							!processedTimeToIdsMap[note.updatedTimestamp]?.has(note.id),
					),
				);

			if (notes.length === 0) break;

			// Update index
			await Promise.all(
				notes.map(async (note) => {
					await index.add(
						note.id,
						note.content.title + ' ' + note.content.text,
					);

					if (note.updatedTimestamp) {
						if (!processedTimeToIdsMap[note.updatedTimestamp])
							processedTimeToIdsMap[note.updatedTimestamp] = new Set();
						processedTimeToIdsMap[note.updatedTimestamp].add(note.id);
					}
				}),
			);
			await index.commit();

			const note = notes.at(-1)!;
			const lastTimestamp =
				note.updatedTimestamp ?? note.createdTimestamp ?? Date.now();
			await this.state.set({
				updatedAt: lastTimestamp,
				processedIds: Array.from(processedTimeToIdsMap[lastTimestamp]) ?? [],
			});

			notesProcessed += notes.length;
		}

		return notesProcessed;
	}
}
