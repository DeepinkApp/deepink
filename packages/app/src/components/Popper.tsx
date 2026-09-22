import React, { forwardRef } from 'react';
import { Box, BoxProps, mergeRefs, Portal } from '@chakra-ui/react';
import {
	autoPlacement,
	autoUpdate,
	Boundary,
	hide,
	offset,
	OffsetOptions,
	Placement,
	shift,
	size,
	useDismiss,
	useFloating,
	useInteractions,
} from '@floating-ui/react';

export type PopperProps = BoxProps & {
	referenceRef?: HTMLElement;
	onClose?: () => void;
};

export const Popper = forwardRef<
	HTMLDivElement,
	PopperProps & {
		allowedPlacements?: Placement[];
		offset?: OffsetOptions;
		viewportOffset?: number;
		boundary?: Boundary;
	}
>(
	(
		{
			referenceRef,
			onClose,
			allowedPlacements = ['top', 'top-end', 'top-start'],
			offset: offsetConfig = { mainAxis: 2 },
			viewportOffset = 5,
			children,
			boundary,
			...props
		},
		ref,
	) => {
		// Manage popper
		const { refs, floatingStyles, context } = useFloating({
			open: true,
			onOpenChange: (open) => {
				if (!open && onClose) onClose();
			},
			strategy: 'fixed',
			middleware: [
				offset(offsetConfig),
				hide({ boundary, altBoundary: true }),
				shift({ boundary, crossAxis: true }),
				autoPlacement({
					allowedPlacements,
					boundary,
					altBoundary: true,
					crossAxis: true,
				}),
				size({
					boundary,
					altBoundary: true,
					apply({ availableWidth, availableHeight, elements }) {
						// Change styles, e.g.
						Object.assign(elements.floating.style, {
							maxWidth: `${Math.max(0, availableWidth - viewportOffset)}px`,
							maxHeight: `${Math.max(0, availableHeight - viewportOffset)}px`,
						});
					},
				}),
			],
			whileElementsMounted: autoUpdate,
			elements: {
				reference: referenceRef,
			},
		});

		const dismiss = useDismiss(context);
		const { getFloatingProps } = useInteractions([dismiss]);

		return children ? (
			<Portal>
				<Box
					ref={mergeRefs(refs.setFloating, ref)}
					tabIndex={0}
					{...props}
					style={{ ...floatingStyles, ...props.style }}
					{...getFloatingProps()}
				>
					{children}
				</Box>
			</Portal>
		) : null;
	},
);
