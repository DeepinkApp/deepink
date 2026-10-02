import { MutexMap } from './MutexMap';
import { PathsResolver } from './PathsResolver';
import { Tombstones } from './Tombstones';
import { UploadSession } from './UploadSession';

export class UploadSessions {
	private readonly pathUploadSessions = new Map<string, string>();
	private readonly uploadSessions = new Map<string, UploadSession>();
	private readonly mutexMap = new MutexMap();
	private readonly tombstones = new Tombstones(60_000);

	constructor(private readonly paths: PathsResolver) {}

	public async create(fileId: string, subdir: string) {
		const paths = this.paths.getFilePaths(subdir, fileId);

		if (!this.paths.isAllowedPath(paths.resolvedPath))
			throw new Error(`File name must not start from '${this.paths.getPrefix()}'`);

		return this.mutexMap.runExclusive(paths.resolvedPath, async () => {
			// Cancel previous session
			const previousSessionId = this.pathUploadSessions.get(paths.resolvedPath);
			if (previousSessionId !== undefined) {
				const session = this.uploadSessions.get(previousSessionId);
				if (session) {
					const error = new Error('Another session is started');
					this.tombstones.set(previousSessionId, error);
					this.uploadSessions.delete(previousSessionId);
					await session.abort(error);
				}
			}

			// Start new session
			const session = new UploadSession(paths);

			const sessionId = this.getSessionId();
			this.pathUploadSessions.set(paths.resolvedPath, sessionId);
			this.uploadSessions.set(sessionId, session);

			await session.init(() => {
				// Terminate session
				this.uploadSessions.delete(sessionId);

				// Cleanup related
				const currentSessionId = this.pathUploadSessions.get(paths.resolvedPath);
				if (currentSessionId === sessionId)
					this.pathUploadSessions.delete(paths.resolvedPath);
			});

			return sessionId;
		});
	}

	public getByFilename(filename: string) {
		const sessionId = this.pathUploadSessions.get(filename);
		return sessionId ? this.getById(sessionId) : undefined;
	}

	public getById(sessionId: string) {
		const session = this.uploadSessions.get(sessionId);
		if (session) return session;

		const tombstone = this.tombstones.get(sessionId);
		// eslint-disable-next-line @typescript-eslint/only-throw-error
		if (tombstone) throw tombstone;

		return null;
	}

	private uploadId = 0;
	private getSessionId() {
		return String(++this.uploadId);
	}
}
