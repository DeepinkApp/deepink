import React from 'react';
import { Switch } from '@chakra-ui/react';

/**
 * Simplified switch wrapper over Chakra v3 compound Switch component.
 * Preserves the simple v2-like API: checked, onCheckedChange, children as label.
 */
export type SimpleSwitchProps = {
	size?: Switch.RootProps['size'];
	checked?: boolean;
	defaultChecked?: boolean;
	disabled?: boolean;
	onCheckedChange?: (details: { checked: boolean }) => void;
	children?: React.ReactNode;
};

export const SimpleSwitch = ({
	size,
	checked,
	defaultChecked,
	disabled,
	onCheckedChange,
	children,
}: SimpleSwitchProps) => {
	return (
		<Switch.Root
			size={size}
			checked={checked}
			defaultChecked={defaultChecked}
			disabled={disabled}
			onCheckedChange={onCheckedChange}
		>
			<Switch.HiddenInput />
			<Switch.Control>
				<Switch.Thumb />
			</Switch.Control>
			{children && <Switch.Label>{children}</Switch.Label>}
		</Switch.Root>
	);
};
