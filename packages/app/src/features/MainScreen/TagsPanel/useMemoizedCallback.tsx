import { useCallback, useRef } from 'react';

/**
 * Like `useCallback`, but for use in `.map`
 */
export function useMemoizedCallback<T>(cb: (arg: T) => void) {
	const cache = useRef(new Map<T, () => void>());

	// Clear cache when callback changes to prevent stale closures
	const cbRef = useRef(cb);
	if (cbRef.current !== cb) {
		cache.current.clear();
		cbRef.current = cb;
	}

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
