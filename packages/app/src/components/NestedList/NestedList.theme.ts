import { defineSlotRecipe } from '@chakra-ui/react';

export const NestedListTheme = defineSlotRecipe({
	slots: ['root', 'item', 'content', 'group'],
	base: {
		root: {
			margin: '0',
			paddingLeft: '0',
			listStyle: 'none',

			fontFamily: 'Arial, Helvetica, sans-serif',
			userSelect: 'none',
			'& &': {
				paddingStart: '.5rem',
			},
			w: '100%',
			gap: '0',
		},
		item: {
			w: '100%',
			lineHeight: '1.1rem',
			gap: '0',
		},
		content: {
			w: '100%',
			borderRadius: '4px',
		},
		group: {
			w: '100%',
			paddingStart: '.5rem',
		},
	},
	variants: {
		variant: {
			default: {
				content: {
					color: 'control.ghost.foreground',
					backgroundColor: 'transparent',

					'&:hover': {
						color: 'control.ghost.hover.foreground',
						backgroundColor: 'control.ghost.hover.background',
					},

					_selected: {
						color: 'control.ghost.active.foreground',
						background: 'control.ghost.active.background',
					},
				},
			},
		},
	},
	defaultVariants: {
		variant: 'default',
	},
});
