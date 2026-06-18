/* eslint-disable @cspell/spellchecker */
import {
	createSystem,
	defaultConfig,
	defineConfig,
	defineRecipe,
	defineSlotRecipe,
} from '@chakra-ui/react';
import { codeBlockAnatomy } from '@chakra-ui/react/anatomy';

import { linkRecipe } from '../components/Link';
import { CSS_RESET_CLASS_NAME } from './constants';

// Text recipe with variants
const textRecipe = defineRecipe({
	base: {
		margin: 0,
	},
	variants: {
		size: {
			md: {
				fontSize: '1rem',
			},
			lg: {
				fontSize: '1.4rem',
			},
		},
		variant: {
			body: {
				fontFamily: 'body',
			},
			description: {
				fontFamily: 'body',
				color: 'brand.secondary',
			},
			hero: {
				fontSize: '20px',
				color: 'brand.secondary',
			},
			feature: {
				fontSize: '18px',
				color: 'brand.secondary',
			},
			intro: {
				fontSize: '22px',
				color: 'brand.secondary',
			},
		},
	},
	defaultVariants: {
		variant: 'body',
		size: 'md',
	},
});

const customConfig = defineConfig({
	theme: {
		tokens: {
			colors: {
				accent: {
					50: { value: '#fdf7f5' },
					100: { value: '#fbece8' },
					200: { value: '#f7d8d2' },
					300: { value: '#efbba9' },
					400: { value: '#e07d63' },
					500: { value: '#cc583b' },
					600: { value: '#b54d32' },
					700: { value: '#943e28' },
					800: { value: '#6b2c1d' },
					900: { value: '#3b1810' },
				},
				sand: {
					50: { value: '#fbfaf7' },
					100: { value: '#f7f4ef' },
					200: { value: '#f1eae0' },
					300: { value: '#eae0d0' },
					400: { value: '#e9ddcf' },
					500: { value: '#9c9384' },
				},
				typography: {
					base: { value: '#191919' },
					secondary: { value: '#6b665c' },
					inverted: { value: '#fbfaf7' },
				},
			},
			fonts: {
				body: {
					value: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Roboto, Inter, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
				},
				heading: {
					value: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Roboto, "Inter", "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`,
				},
			},
		},
		semanticTokens: {
			colors: {
				brand: {
					primary: { value: '#b54d32' },
					primaryHover: { value: '#943e28' },
					secondary: { value: '#6b665c' },
					buttonSecondaryBg: { value: '#f7f4ef' },
					buttonSecondaryText: { value: '#b54d32' },
					heroHeader: { value: '#191919' },
					hrBorder: { value: '#eae0d0' },
				},

				bg: {
					canvas: { value: '#fbfaf7' },
					image: { value: '#f7f4ef' },
					panel: { value: '#f7f4ef' },
				},

				'color-palette-focus-ring': {
					value: '#e07d63',
				},

				'link.default': { value: '{colors.brand.primary}' },
				'link.hover': { value: '{colors.brand.primaryHover}' },
				border: {
					thin: { value: '#f1eae0' },
					contrast: { value: '#d5cdc0' },
				},
			},
		},
		recipes: {
			code: defineRecipe({
				defaultVariants: {
					variant: 'outline',
				},
			}),
			link: linkRecipe,
			text: textRecipe,
			heading: defineRecipe({
				base: {
					wordBreak: 'break-word',
				},
			}),
			separator: defineRecipe({
				base: {
					borderColor: 'border.thin',
					borderBottomWidth: '0',
				},
			}),
		},
		slotRecipes: {
			codeBlock: defineSlotRecipe({
				slots: codeBlockAnatomy.keys(),
				base: {
					code: {
						'& ::selection': {
							bg: '#f1eae0',
							color: '#191919',
						},
					},
				},
			}),
		},
	},
	globalCss: {
		'*': {
			boxSizing: 'border-box',
		},
		'::selection': {
			bg: '#f1eae0',
		},
		':root': {
			bg: 'bg.canvas',
			fontFamily: 'body',
		},
		body: {
			margin: 0,
		},
		img: {
			maxWidth: '100%',
			bg: 'bg.image',
		},
		a: {
			textDecoration: 'none',
			color: 'link.default',
			_hover: {
				color: 'link.hover',
			},
		},
		hr: {
			border: 0,
			borderBottom: '1px solid',
			borderColor: 'brand.hrBorder',
		},
	},
});

export const system = createSystem(defaultConfig, customConfig, {
	preflight: {
		scope: `.${CSS_RESET_CLASS_NAME}`,
	},
});
