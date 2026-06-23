import React, { createContext, useContext } from 'react';
import { chakra, defineRecipe, type RecipeDefinition } from '@chakra-ui/react';

import { system } from '../theme';

export const LinkContext = createContext<'external' | 'internal' | 'auto'>('auto');

// Create wrapper components that use our custom recipes
// These will properly type-check with our variant definitions

export const linkRecipe = defineRecipe({
	base: {
		textDecoration: 'none',
		cursor: 'pointer',
		boxSizing: 'border-box',
	},
	variants: {
		variant: {
			default: {
				color: 'link.default',
				_hover: {
					color: 'link.hover',
				},
				display: 'inline-block',
			},
			plain: {
				color: 'black',
				textDecoration: 'none',
				_hover: {
					textDecoration: 'none',
					color: 'black',
				},
			},
			native: {
				color: 'inherit',
				textDecoration: 'underline',
				_hover: {
					color: 'link.hover',
				},
			},
			header: {
				color: 'inherit',
				_hover: {
					textDecoration: 'underline',
					color: 'link.hover',
				},
			},
			nav: {
				display: 'inline-flex',
				userSelect: 'none',
				fontSize: '1rem',
				padding: '.4rem .8rem',
				borderRadius: '6px',
				fontWeight: '500',
				color: 'typography.base',
				_hover: {
					bg: 'sand.200',
				},
			},
			'button-primary': {
				display: 'inline-block',
				userSelect: 'none',
				fontSize: { base: '1.2rem', sm: '1.5rem' },
				px: '1.4rem',
				py: '0.7rem',
				borderRadius: '8px',
				fontWeight: '500',
				bg: 'accent.500',
				color: 'accent.50',
				_hover: {
					bg: 'accent.600',
				},
			},
			'button-secondary': {
				display: 'inline-block',
				userSelect: 'none',
				fontSize: { base: '1.2rem', sm: '1.5rem' },
				px: '1.4rem',
				py: '0.7rem',
				borderRadius: '8px',
				fontWeight: '500',
				bg: 'sand.200',
				color: 'typography.secondary',
				_hover: {
					bg: 'sand.300',
				},
			},
		},
	},
	defaultVariants: {
		variant: 'default',
	},
});

export const Link = React.forwardRef<
	HTMLAnchorElement,
	React.ComponentProps<typeof chakra.a> & {
		variant?: typeof linkRecipe extends RecipeDefinition<infer X>
			? keyof X['variant']
			: never;
	}
>((props, ref) => {
	const { variant = 'default', ...rest } = props;
	const recipe = system._config.theme?.recipes?.link;
	const styles = recipe ? system.cva(recipe)({ variant }) : {};

	const linkContextMode = useContext(LinkContext);
	const isExternalLink =
		linkContextMode === 'external' ||
		(linkContextMode === 'auto' && props.href?.startsWith('http'));

	return (
		<chakra.a
			ref={ref}
			{...(isExternalLink
				? {
						target: '_blank',
						rel: 'noopener noreferrer',
					}
				: undefined)}
			{...styles}
			{...rest}
		/>
	);
});
Link.displayName = 'Link';
