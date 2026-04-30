import { Remote, wrap } from 'comlink';

import { CryptographyUtilsWorker } from '.';

export class CryptographyUtils implements CryptographyUtilsWorker {
	private state: {
		api: Remote<CryptographyUtilsWorker>;
		worker: Worker;
	} | null = null;
	constructor() {
		const worker = new Worker(
			/* webpackChunkName: "CryptographyUtils.worker" */ new URL(
				'./CryptographyUtils.worker',
				import.meta.url,
			),
			{ type: 'module' },
		);
		const api = wrap<CryptographyUtilsWorker>(worker);

		this.state = { api, worker };
	}

	private isDisposed = false;
	public async dispose() {
		if (!this.state) return;

		this.state.worker.terminate();
		this.isDisposed = true;

		this.state = null;
	}

	private getState() {
		if (this.isDisposed) throw new Error('Instance is disposed');
		if (!this.state) throw new Error('State is not set yet');

		return this.state;
	}

	public async deriveBits(
		input: Uint8Array<ArrayBuffer>,
		salt: Uint8Array<ArrayBuffer>,
		length: number,
		config?: {
			memory?: number;
			ops?: number;
		},
	) {
		// TODO: delete explicit copy
		// We temporary copy buffers explicitly, because of bug https://github.com/vitest-dev/vitest/issues/9927
		return this.getState().api.deriveBits(
			input.slice(),
			salt.slice(),
			length,
			config,
		);
	}
}
