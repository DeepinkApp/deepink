import { RefObject } from 'react';

export type ItemSizeEstimatorOptions = { defaultSize: number };

// TODO: add option `strategy` to control if return avg size or most recently measured, etc
/**
 * Util for virtual list to create instance for node size estimation
 */
export const estimateItemSize = <T extends unknown>(
	elementRef: RefObject<T>,
	{ defaultSize }: ItemSizeEstimatorOptions,
) => {
	const sizes = new Map<number, number>();
	const getItemSize = (index: number) => {
		// Try to return actual size from cache
		const indexSize = sizes.get(index);
		if (indexSize !== undefined) return indexSize;

		// Try to guess probable size if have enough stats
		const cachedSizes = sizes.values().take(1).toArray();
		if (cachedSizes.length > 0) {
			return cachedSizes[0];
		}

		return defaultSize;
	};

	return (index: number) => {
		// Try to update size
		const root = elementRef.current;
		if (root && root instanceof HTMLElement) {
			const item = root.querySelector(`[data-index="${index}"]`);
			if (item) {
				sizes.set(index, item.clientHeight);
			}
		}

		return getItemSize(index);
	};
};
