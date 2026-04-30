export class Terminable {
	private isFinished = false;

	public terminate() {
		this.isFinished = true;
	}

	public isTerminated() {
		return this.isFinished;
	}

	public throwErrorIfTerminated(message?: string) {
		const errorMessage =
			message ?? "Object been terminated and can't be used anymore";
		if (this.isFinished) throw new Error(errorMessage);
	}
}

export class DisposableBox<T> {
	private readonly data;
	private readonly cleanup;
	private readonly controller;
	constructor(data: T, cleanup?: () => void | Promise<void>) {
		this.data = data;
		this.cleanup = cleanup;
		this.controller = new Terminable();
	}

	public getContent() {
		this.controller.throwErrorIfTerminated();
		return this.data;
	}

	public async dispose() {
		if (this.cleanup) {
			const cleanupResult = this.cleanup();
			if (cleanupResult instanceof Promise) await cleanupResult;
		}

		this.controller.terminate();
		(this as any).data = null;
	}

	public isDisposed() {
		return this.controller.isTerminated();
	}
}

/**
 * Util to simplify consume-then-dispose scenario,
 * when we want to get content, use it once and call the `dispose` unconditionally,
 * even if any error happens.
 *
 * For example, when we want to wipe the crypto material after use.
 *
 * @param container `DisposableBox`
 * @param consumer callback to consume the content and return result
 */
export const consumeDisposable = async <T, R>(
	container: DisposableBox<T>,
	consumer: (content: T) => Promise<R>,
): Promise<R> => {
	try {
		const content = container.getContent();
		const result = await consumer(content);
		return result;
	} finally {
		await container.dispose();
	}
};
