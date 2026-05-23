import React, { useReducer } from 'react';
import { FaRotateLeft } from 'react-icons/fa6';
import { HStack, Slider } from '@chakra-ui/react';
import { IconButton } from '@components/IconButton';
import { Tooltip } from '@components/ui/tooltip';

export type SimpleSliderProps = {
	value: number;
	min: number;
	max: number;
	step?: number;
	onChange?: (value: number) => void;
	onValueChangeEnd?: (value: number) => void;
	transformValue?: (value: number) => string;
	resetValue?: number;
};

type SliderState = { hover: boolean; dragging: boolean };

/**
 * Simple to use slider control
 */
export const SimpleSlider = ({
	transformValue,
	resetValue,
	value,
	min,
	max,
	step,
	onChange,
	onValueChangeEnd,
}: SimpleSliderProps) => {
	const [state, updateState] = useReducer<SliderState, [Partial<SliderState>]>(
		(state, changes) => {
			return { ...state, ...changes };
		},
		{
			hover: false,
			dragging: false,
		},
	);

	return (
		<HStack width="100%" align="start">
			<Slider.Root
				width="100%"
				value={[value]}
				min={min}
				max={max}
				step={step}
				onMouseEnter={() => updateState({ hover: true })}
				onMouseLeave={() => updateState({ hover: false })}
				onValueChange={(details) => {
					const v = details.value[0];
					if (v !== undefined) onChange?.(v);
				}}
				onValueChangeEnd={(details) => {
					updateState({ dragging: false });
					const v = details.value[0];
					if (v !== undefined) onValueChangeEnd?.(v);
				}}
			>
				<Slider.Control>
					<Slider.Track>
						<Slider.Range />
					</Slider.Track>
					<Tooltip
						showArrow
						content={transformValue ? transformValue(value) : value}
						open={state.dragging || state.hover}
						positioning={{
							placement: 'top',
						}}
					>
						<Slider.Thumb index={0}>
							<Slider.HiddenInput />
						</Slider.Thumb>
					</Tooltip>
				</Slider.Control>
				<Slider.MarkerGroup>
					<Slider.Marker
						value={min}
						mt="1"
						fontSize="sm"
						color="typography.secondary"
					>
						{transformValue ? transformValue(min) : min}
					</Slider.Marker>
					<Slider.Marker
						value={max}
						mt="1"
						fontSize="sm"
						color="typography.secondary"
						transform="translateX(-100%)"
					>
						{transformValue ? transformValue(max) : max}
					</Slider.Marker>
				</Slider.MarkerGroup>
			</Slider.Root>
			{resetValue !== undefined && (
				<IconButton
					size="sm"
					icon={<FaRotateLeft />}
					title="Reset to default value"
					disabled={value === resetValue}
					onClick={() => {
						onChange?.(resetValue);
					}}
				/>
			)}
		</HStack>
	);
};
