import { z } from 'zod';
import { DebouncedPromises } from '@utils/debounce/DebouncedPromises';

import { AsyncState } from './AsyncState';
import { IFileController } from '.';

export class StateFile<
	T extends z.ZodType,
	D extends z.TypeOf<T> | void,
> implements AsyncState<z.TypeOf<T>> {
	constructor(
		private readonly file: IFileController,
		private readonly scheme: T,
		private readonly config: {
			defaultValue?: D;
			ignoreFileReadErrors?: boolean;
			ignoreParsingErrors?: boolean;
		} = {},
	) {}

	async get(
		options: { onError?: (error: unknown) => void } = {},
	): Promise<void extends D ? z.TypeOf<T> | null : z.TypeOf<T>> {
		const {
			defaultValue = null,
			ignoreParsingErrors = true,
			ignoreFileReadErrors,
		} = this.config;

		// Parse data in state file
		const rawJson = await this.file.get().catch((error) => {
			if (ignoreFileReadErrors) {
				console.error(error);
				if (options.onError) options.onError(error);
				return null;
			}

			throw error;
		});
		if (!rawJson)
			return defaultValue as void extends D ? z.TypeOf<T> | null : z.TypeOf<T>;

		try {
			const parseResult = this.scheme.safeDecode(
				JSON.parse(new TextDecoder().decode(rawJson)),
			);
			if (parseResult.success) return parseResult.data;
			else if (!ignoreParsingErrors) throw parseResult.error;
		} catch (error) {
			if (!ignoreParsingErrors) throw error;
			if (options.onError) options.onError(error);
		}

		return defaultValue as void extends D ? z.TypeOf<T> | null : z.TypeOf<T>;
	}

	private readonly queue = new DebouncedPromises();
	async set(value: z.TypeOf<T>): Promise<void> {
		const validValue = this.scheme.encode(value);

		await this.queue.add(async () => {
			await this.file.write(
				new TextEncoder().encode(JSON.stringify(validValue)).buffer,
			);
		});
	}

	async clean(): Promise<void> {
		await this.file.delete();
	}
}
