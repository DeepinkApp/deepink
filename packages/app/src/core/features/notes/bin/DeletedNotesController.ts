import ms from 'ms';
import { wait } from '@utils/time';

import { NotesController } from '../controller/NotesController';

// TODO: add tests with restore from bin and different time zones

export class DeletedNotesController {
	constructor(
		private readonly controllers: {
			notes: NotesController;
		},
		private readonly config: {
			retentionTime: number;
			considerModificationTime?: boolean;
		},
	) {}

	/**
	 * Permanently deletes all notes marked as deleted
	 */
	public async empty() {
		const { notes } = this.controllers;

		const noteIds = await notes.query({ meta: { isDeleted: true } });

		await notes.delete(noteIds);

		return noteIds.length;
	}

	/**
	 * Permanently deletes a notes marked as deleted longer than allow a retention policy
	 */
	public async purgeExpired() {
		const { notes } = this.controllers;
		const { retentionTime, considerModificationTime } = this.config;

		const validityDate = Date.now() - retentionTime;
		const noteIds = await notes.query({
			deletedAt: {
				to: new Date(validityDate),
			},
			updatedAt: {
				to: considerModificationTime ? new Date(validityDate) : undefined,
			},
		});

		await notes.delete(noteIds);

		return noteIds.length;
	}

	public async startService({ onClean }: { onClean?: (count: number) => void } = {}) {
		const { retentionTime } = this.config;

		const abortController = new AbortController();
		const abortSignal = abortController.signal;
		const abortPromise = new Promise<void>((res) => {
			abortSignal.addEventListener(
				'abort',
				function () {
					res();
				},
				{ once: true },
			);
		});

		const proc = new Promise(async (resolve) => {
			const maxWait = ms('5h');
			while (true) {
				// Exit by signal
				if (abortSignal.aborted) {
					resolve(abortSignal.reason);
					return;
				}

				// Wait if needed
				const earliestDeletionTime = await this.getEarliestDeletionTime();
				const validityDate = Date.now() - retentionTime;
				const waitTime =
					earliestDeletionTime !== null
						? earliestDeletionTime - validityDate
						: retentionTime;
				if (waitTime > 0) {
					const maxTimeToWait = Math.min(waitTime, maxWait);
					await Promise.race([wait(maxTimeToWait), abortPromise]);

					if (abortSignal.aborted) {
						resolve(abortSignal.reason);
						return;
					}

					continue;
				}

				// Delete expired
				const count = await this.purgeExpired();
				if (onClean) onClean(count);
			}
		});

		return () => {
			abortController.abort(0);
			return proc;
		};
	}

	public async getEarliestDeletionTime() {
		const { notes } = this.controllers;
		const { considerModificationTime } = this.config;

		return notes
			.get({
				meta: { isDeleted: true },
				sort: [
					{
						by: considerModificationTime ? 'updatedAt' : 'deletedAt',
						order: 'asc',
					},
				],
				limit: 1,
			})
			.then((notes) => {
				const note = notes[0];

				if (!note || note.deletedAt === undefined) return null;

				return Math.max(
					note.deletedAt,
					considerModificationTime ? (note.updatedTimestamp ?? 0) : 0,
				);
			});
	}
}
