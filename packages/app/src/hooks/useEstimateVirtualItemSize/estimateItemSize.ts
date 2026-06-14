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
	let maxSize = defaultSize;

	const getItemSize = (index: number) => {
		// Return actual size from cache if recorded
		const indexSize = sizes.get(index);
		if (indexSize !== undefined) return indexSize;

		return maxSize;
	};

	return (index: number) => {
		// Try to update size
		const root = elementRef.current;
		if (root && root instanceof HTMLElement) {
			const item = root.querySelector(`[data-index="${index}"]`);
			if (item) {
				const itemSize = item.clientHeight;
				if (itemSize !== sizes.get(index)) {
					sizes.set(index, item.clientHeight);

					// Update max size
					if (itemSize > maxSize) maxSize = itemSize;
				}
			}
		}

		return getItemSize(index);
	};
};
