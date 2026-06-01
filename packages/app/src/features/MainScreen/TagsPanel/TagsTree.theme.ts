import { defineSlotRecipe } from '@chakra-ui/react';

export const TagsTreeRecipe = defineSlotRecipe({
	slots: ['root', 'container', 'item', 'content', 'expandButton'],
	base: {
		root: {
			width: '100%',
			height: '100%',

			// Indent of scroll
			paddingInlineEnd: '.5rem',
			overflow: 'auto',

			fontFamily: 'Arial, Helvetica, sans-serif',
			userSelect: 'none',
		},
		container: {
			display: 'flex',
			flexDirection: 'column',
			gap: '1px',
		},
		item: {
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
			userSelect: 'none',
			paddingInline: '.5rem',
			gap: '.5rem',
		},
		content: {
			width: '100%',
			alignContent: 'start',
			lineHeight: '1.1rem',
			gap: '.5rem',
			paddingBlock: '0.4rem',
			paddingInline: '0.6rem',
		},
	},
	variants: {
		variant: {
			subtle: {
				item: {
					borderRadius: 'md',
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
				expandButton: {
					width: 'auto',
					padding: '2px',
					borderRadius: 'lg',
					'& > svg': {
						boxSize: '1rem',
					},
				},
			},
		},
	},
	defaultVariants: {
		variant: 'subtle',
	},
});
