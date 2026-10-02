import { createEvent } from 'effector';
import { IFileController } from '@core/features/files';
import { debounce } from '@utils/debounce/debounce';

import { IDatabaseContainer } from '.';

export type IManagedDatabase<T> = {
	/**
	 * Returns database
	 */
	get: () => T;

	/**
	 * Write database to file
	 *
	 * DB automatically sync with updates, call this method to force sync
	 */
	sync: () => Promise<void>;

	/**
	 * Sync DB and close
	 */
	close: () => Promise<void>;

	/**
	 * Event listener for sync
	 */
	onSync: (handler: SyncEventHandler) => () => void;
};

export type SyncStatus = 'pending' | 'complete';

export type SyncEventHandler = (status: SyncStatus) => void;

export type SyncRequest = {
	resolve(): void;
	reject(err: Error): void;
};

export type Options = {
	sync?: {
		delay: number;
		deadline: number;
	};
};

const requestRunOnIdle = (cb: () => void, deadline: number) => {
	if (typeof globalThis.requestIdleCallback === 'function') {
		globalThis.requestIdleCallback(cb, { timeout: deadline });
		return;
	}

	setTimeout(cb, 0);
};

/**
 * Class to manage database data synchronization
 */
export class ManagedDatabase<T> implements IManagedDatabase<T> {
	public readonly dbContainer;
	private readonly dbFile: IFileController;
	private readonly debouncedSync;
	private readonly cleanups: (() => void)[] = [];
	constructor(
		dbContainer: IDatabaseContainer<T>,
		dbFile: IFileController,
		{ sync = { delay: 1300, deadline: 8000 } }: Options = {},
	) {
		this.dbContainer = dbContainer;
		this.dbFile = dbFile;

		// Auto sync changes
		this.debouncedSync = debounce(
			() => {
				requestRunOnIdle(() => this.sync(), sync.deadline);
			},
			{
				wait: sync.delay,
			},
		);

		this.cleanups.push(dbContainer.onChanged.watch(this.debouncedSync));
	}

	public get = () => {
		return this.dbContainer.getDatabase();
	};

	public sync = () => {
		if (!this.dbContainer.isOpened()) throw new Error('Database are closed');

		this.onSyncStateUpdated('pending');

		return new Promise<void>((resolve, reject) => {
			// Add task
			this.syncRequests.push({ resolve, reject });

			// Run worker if not started
			this.syncWorker();
		});
	};

	public close = async () => {
		if (!this.dbContainer.isOpened()) return;

		// Cleanup any listeners
		for (const cleanup of this.cleanups) {
			cleanup();
		}

		// Sync latest changes immediately
		this.debouncedSync.cancel();
		await this.sync();

		// Close DB
		await this.dbContainer.close();
	};

	public onSync = (handler: SyncEventHandler) => {
		const cleanup = this.onSyncStateUpdated.watch(handler);
		return () => cleanup();
	};

	private readonly onSyncStateUpdated = createEvent<SyncStatus>();
	private isSyncWorkerRun = false;
	private syncRequests: SyncRequest[] = [];
	private readonly syncWorker = async () => {
		if (this.isSyncWorkerRun) return;

		this.isSyncWorkerRun = true;
		while (this.syncRequests.length > 0) {
			// Get requests to handle and flush array
			const syncRequestsInProgress = this.syncRequests;
			this.syncRequests = [];

			// Control execution and forward exceptions to promises
			try {
				// Dump data to file
				const buffer = await this.dbContainer.getData();
				await this.dbFile.write(buffer);

				// Resolve requests
				syncRequestsInProgress.forEach((syncRequest) => syncRequest.resolve());
			} catch (err) {
				const errorToThrow =
					err instanceof Error ? err : new Error('Unknown error');
				syncRequestsInProgress.forEach((syncRequest) =>
					syncRequest.reject(errorToThrow),
				);
			}
		}

		this.isSyncWorkerRun = false;
		this.onSyncStateUpdated('complete');
	};
}
