/* eslint-disable @cspell/spellchecker */
import {
	createSystem,
	defaultConfig,
	defineConfig,
	defineRecipe,
} from '@chakra-ui/react';

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
				bg: {
					canvas: { value: '#fff6eb' },
					image: { value: '#ffe7d3' },
				},
				brand: {
					primary: { value: '#b55d0e' },
					primaryHover: { value: '#f36e02' },
					secondary: { value: '#654c3d' },
					buttonSecondaryBg: { value: '#ffe7d3' },
					buttonSecondaryText: { value: '#754f2f' },
					heroHeader: { value: '#321e04' },
					hrBorder: { value: '#f4e5dd' },
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
				'color-palette-focus-ring': {
					value: '{colors.orange.500}',
				},

				'link.default': { value: '{colors.brand.primary}' },
				'link.hover': { value: '{colors.brand.primaryHover}' },
				border: {
					thin: { value: '#f6e8d5' },
					contrast: { value: '#ffdbbd' },
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
	},
	globalCss: {
		'*': {
			boxSizing: 'border-box',
		},
		'::selection': {
			bg: '#ffe7d3',
			color: '#b55d0e',
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
