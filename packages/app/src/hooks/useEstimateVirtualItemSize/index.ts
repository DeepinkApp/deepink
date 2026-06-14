import { RefObject, useMemo } from 'react';

import { estimateItemSize, ItemSizeEstimatorOptions } from './estimateItemSize';

export const useEstimateVirtualItemSize = <T>(
	elementRef: RefObject<T>,
	options: ItemSizeEstimatorOptions,
) => {
	return useMemo(() => estimateItemSize(elementRef, options), [elementRef, options]);
};
