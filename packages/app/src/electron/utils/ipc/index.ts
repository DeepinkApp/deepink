export interface ChannelOptions {
	readonly name: string;
}

type ApiSchema = Record<string, (...args: any[]) => Promise<any>>;

export type ApiToMappers<T extends ApiSchema> = {
	[K in keyof T]: (
		args: Parameters<T[K]>,
		sendRequest: (args: Parameters<T[K]>) => ReturnType<T[K]>,
	) => ReturnType<T[K]>;
};

export type ApiToHandlers<T extends ApiSchema, Context = never> = {
	[K in keyof T]: (parameters: {
		req: Parameters<T[K]>;
		ctx: Context;
	}) => ReturnType<T[K]> extends Promise<infer R> ? Promise<R | undefined> : never;
};

export type ClientFetcher<T extends ApiSchema = {}> = (
	endpoint: string,
	args: Parameters<T[keyof T]>,
) => ReturnType<T[keyof T]>;

export type ServerRequestHandler<Context = never> = (
	endpoint: string,
	callback: (parameters: { req: any; ctx: Context }) => any,
) => () => void;

export const createChannel = <T extends ApiSchema>(options: ChannelOptions) => {
	const getResolvedEndpointName = (methodName: string) =>
		[options.name, methodName].join('.');

	return {
		client: (
			fetcher: ClientFetcher<T>,
			mappers: Partial<ApiToMappers<T>> = {},
		): T => {
			// Return proxy object with virtual callbacks
			return new Proxy<T>({} as any, {
				get: function (target, methodName: string) {
					if (typeof methodName !== 'string') return target[methodName];

					const endpoint = getResolvedEndpointName(methodName);
					const mapper = mappers[methodName as keyof T];
					return (...args: Parameters<T[keyof T]>) => {
						if (mapper) {
							return mapper(args, (mappedArgs) =>
								fetcher(endpoint, mappedArgs),
							);
						}

						return fetcher(endpoint, args);
					};
				},
			});
		},
		server: <Context = never>(
			receiver: ServerRequestHandler<Context>,
			callbacks: ApiToHandlers<T, Context>,
		): (() => void) => {
			// Subscribe on channels
			const cleanups = Object.keys(callbacks).map((methodName) =>
				receiver(getResolvedEndpointName(methodName), (params) =>
					callbacks[methodName](params),
				),
			);
			return () => {
				cleanups.forEach((cleanup) => cleanup());
			};
		},
	};
};
