import { useCallback, useRef } from 'react';

export function useHandlerFactory<T>(cb: (arg: T) => void) {
	const cache = useRef(new Map<T, () => void>());

	return useCallback(
		(arg: T) => {
			let fn = cache.current.get(arg);

			if (!fn) {
				fn = () => cb(arg);
				cache.current.set(arg, fn);
			}

			return fn;
		},
		[cb],
	);
}
