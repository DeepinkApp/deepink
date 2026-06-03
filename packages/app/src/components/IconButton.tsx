import React, { forwardRef, memo, ReactNode } from 'react';
import {
	IconButton as BaseIconButton,
	IconButtonProps as BaseIconButtonProps,
} from '@chakra-ui/react';
import { Tooltip, type TooltipProps } from '@components/ui/tooltip';

export type IconButtonProps = Omit<BaseIconButtonProps, 'aria-label'> & {
	icon: ReactNode;
	title: string;
	tooltipPlacement?: string;
	tooltipProps?: Omit<TooltipProps, 'children'>;
};

export const IconButton = memo(
	forwardRef<HTMLButtonElement, IconButtonProps>(
		({ icon, title, tooltipPlacement, tooltipProps, ...buttonProps }, ref) => {
			return (
				<Tooltip
					showArrow
					{...(tooltipProps ?? {})}
					content={title}
					positioning={{
						placement: tooltipPlacement as any,
						...(tooltipProps?.positioning ?? {}),
					}}
				>
					<BaseIconButton ref={ref} aria-label={title} {...buttonProps}>
						{icon}
					</BaseIconButton>
				</Tooltip>
			);
		},
	),
);

IconButton.displayName = 'IconButton';
