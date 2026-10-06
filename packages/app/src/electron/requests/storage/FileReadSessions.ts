import { existsSync, renameSync, statSync } from 'fs';

import { FileReadSession } from './FileReadSession';
import { PathsResolver } from './PathsResolver';

export class FileReadSessions {
	private readonly sessions = new Map<string, FileReadSession>();

	constructor(private readonly paths: PathsResolver) {}

	public async create(fileId: string, subdir: string) {
		const paths = this.paths.getFilePaths(subdir, fileId);

		if (!this.paths.isAllowedPath(paths.resolvedPath)) return null;

		// Restore file
		if (
			!existsSync(paths.resolvedPath) &&
			existsSync(paths.bkp) &&
			statSync(paths.bkp).isFile()
		) {
			renameSync(paths.bkp, paths.resolvedPath);
		}

		// Exist for non exists files
		if (!existsSync(paths.resolvedPath) || !statSync(paths.resolvedPath).isFile())
			return null;

		const session = new FileReadSession();
		await session.open(paths.resolvedPath);

		const sessionId = this.getSessionId();
		this.sessions.set(sessionId, session);

		return sessionId;
	}

	public getById(sessionId: string): FileReadSession | null {
		return this.sessions.get(sessionId) ?? null;
	}

	public async close(sessionId: string): Promise<void> {
		const session = this.sessions.get(sessionId);

		if (!session) return;

		this.sessions.delete(sessionId);

		await session.close();
	}

	private sessionId = 0;
	private getSessionId(): string {
		return String(++this.sessionId);
	}
}
