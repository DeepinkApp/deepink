import { MutexMap } from './MutexMap';
import { PathsResolver } from './PathsResolver';
import { UploadSession } from './UploadSession';

export class UploadSessions {
	private readonly mutexMap = new MutexMap();
	private readonly pathUploadSessions = new Map<string, string>();
	private readonly uploadSessions = new Map<string, UploadSession>();

	constructor(private readonly paths: PathsResolver) {}

	public async create(fileId: string, subdir: string) {
		if (!this.paths.isAllowedPath(fileId))
			throw new Error(`File name must not start from '${this.paths.getPrefix()}'`);

		const paths = this.paths.getFilePaths(subdir, fileId);

		return this.mutexMap.runExclusive(paths.resolvedPath, async () => {
			// Cancel previous session
			const previousSessionId = this.pathUploadSessions.get(paths.resolvedPath);
			if (previousSessionId !== undefined) {
				// TODO: schedule deletion by timeout for case the session will not be accessed
				const session = this.uploadSessions.get(previousSessionId);
				if (session) {
					await session.abort(new Error('Another session is started'));
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

		if (sessionId === undefined) return null;
		return this.uploadSessions.get(sessionId) ?? null;
	}

	public getById(sessionId: string) {
		return this.uploadSessions.get(sessionId) ?? null;
	}

	private uploadId = 0;
	private getSessionId() {
		return String(++this.uploadId);
	}
}
