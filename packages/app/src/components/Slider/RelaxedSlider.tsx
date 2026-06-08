import React from 'react';
import { useRelaxedValue } from '@hooks/useRelaxedValue';

import { SimpleSlider, SimpleSliderProps } from './SimpleSlider';

/**
 * Slider with debounced value
 */
export const RelaxedSlider = ({
	value,
	onChange,
	wait,
	...props
}: SimpleSliderProps & { wait?: number }) => {
	const [state, setState] = useRelaxedValue<number>({
		value,
		onChange(value) {
			onChange?.(value);
		},
		wait,
	});

	return <SimpleSlider {...props} value={state} onChange={setState} />;
};
