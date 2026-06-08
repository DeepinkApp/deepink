import { defineSlotRecipe } from '@chakra-ui/react';

export const ListBoxRecipe = defineSlotRecipe({
	slots: ['root', 'item'],
	base: {
		root: {
			margin: '0',
			paddingLeft: '0',
			listStyle: 'none',

			fontFamily: 'Arial, Helvetica, sans-serif',
			userSelect: 'none',
			w: '100%',
			gap: '0',
		},
		item: {
			w: '100%',
			padding: '.8rem 1rem',
			lineHeight: '1.1rem',
			gap: '0',
		},
	},
	variants: {
		variant: {
			subtle: {
				root: {
					borderRadius: 'lg',
					border: '1px solid',
					borderColor: 'surface.border',
				},
				item: {
					color: 'control.ghost.foreground',
					backgroundColor: 'transparent',

					'&:hover': {
						color: 'control.ghost.hover.foreground',
						backgroundColor: 'control.ghost.hover.background',
					},

					_focusVisible: {
						color: 'control.ghost.active.foreground',
						background: 'control.ghost.active.background',
					},
				},
			},
		},
	},
	defaultVariants: {
		variant: 'subtle',
	},
});
