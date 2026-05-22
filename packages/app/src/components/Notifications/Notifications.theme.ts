import { defineSlotRecipe } from '@chakra-ui/react';

export const NotificationsTheme = defineSlotRecipe({
	slots: ['root', 'head', 'body'],
	base: {
		root: {
			position: 'absolute',
			bottom: '2rem',
			right: '0.5rem',
			backgroundColor: 'surface.background',
			borderWidth: '1px',
			borderColor: 'surface.border',
			borderRadius: '4px',
			minWidth: '300px',
			maxWidth: '500px',
			maxHeight: '500px',
			overflow: 'hidden',
		},
		head: {
			w: '100%',
			padding: '.5rem 1rem',
			backgroundColor: 'container.head.background',
			color: 'container.head.foreground',
		},
		body: {
			w: '100%',
			alignItems: 'start',
			padding: '.5rem',
		},
	},
});
