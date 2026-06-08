import { defineSlotRecipe } from '@chakra-ui/react';

export const notePreviewRecipe = defineSlotRecipe({
	slots: ['root', 'body', 'title', 'text', 'meta'],
	base: {
		root: {
			cursor: 'pointer',
			padding: '0.5rem',
			overflow: 'hidden',
			textOverflow: 'ellipsis',
			width: '100%',
			alignItems: 'start',
			gap: '0.6rem',
		},
		body: {
			gap: '0.2rem',
			alignItems: 'normal',
			maxWidth: '100%',
		},
		title: {
			fontWeight: 'bold',
			fontSize: '18px',
		},
		text: {
			fontSize: '14px',
			maxWidth: '100%',
		},
		meta: {
			fontSize: '12px',
			fontWeight: '500',
			width: '100%',
		},
	},
	variants: {
		variant: {
			default: {
				root: {
					borderRadius: '4px',

					backgroundColor: 'control.option.background',
					color: 'control.option.foreground',

					'&:hover': {
						backgroundColor: 'control.option.hover.background',
						color: 'control.option.hover.foreground',
					},

					_selected: {
						backgroundColor: 'control.option.active.background',
						color: 'control.option.active.foreground',
					},
				},
			},
		},
	},
	defaultVariants: {
		variant: 'default',
	},
});
