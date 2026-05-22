import { defineSlotRecipe } from '@chakra-ui/react';

import { theme } from './theme/RichEditor';

export const RichEditorTheme = defineSlotRecipe({
	slots: ['root'],
	base: {
		root: {
			'& pre': {
				whiteSpace: 'break-spaces',
			},
			[`& .${theme.heading.h1}, & .${theme.heading.h2}`]: {
				borderColor: 'surface.border',
			},
			[`& .${theme.hr}`]: {
				borderColor: 'surface.border',
			},
			[`& .${theme.link}`]: {
				borderColor: 'link.base',
			},
			[`& .${theme.quote}`]: {
				color: 'typography.secondary',
				borderColor: 'surface.border',
			},
			[`& .${theme.code}, & .${theme.text.code}`]: {
				color: 'typography.base',
				backgroundColor: 'dim.100',
			},
			[`& .${theme.code}`]: {
				backgroundColor: 'dim.100',
				'&:before': {
					backgroundColor: 'dim.400',
				},
			},
			[`& .${theme.image}`]: {
				display: 'inline-flex',
				maxWidth: '100%',
				'& img': {
					display: 'flex',
					maxWidth: '100%',
				},
			},
		} as any,
	},
});
