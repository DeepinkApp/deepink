import { defineConfig } from '@chakra-ui/react';

export default defineConfig({
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
				focusRing: { value: '{colors.accent.400}' },
				selection: {
					foreground: { value: '#191919' },
					background: { value: '{colors.sand.200}' },
				},
				highlight: {
					foreground: { value: '#191919' },
					background: { value: '{colors.sand.300}' },
				},
				surface: {
					background: { value: '#fbfaf7' },
					invertedBackground: { value: '#191919' },
					panel: { value: '#f7f4ef' },
					border: { value: '#d5cdc0' },
					muted: { value: '#f7f4ef' },
					raised: { value: '#fbfaf7' },
					stripe: { value: '#f7f4ef' },
					section: { value: '#f7f4ef' },
					sunken: { value: '#f1eae0' },
					overlay: { value: '#fbfaf7' },
					tooltip: { value: '#191919' },
				},
				dim: {
					50: { value: '#fbfaf7' },
					100: { value: '#f7f4ef' },
					200: { value: '#f1eae0' },
					400: { value: '#e7dcce' },
					500: { value: '#d5cdc0' },
				},
				overlay: {
					500: { value: '#19191980' },
				},
				message: {
					error: { value: '#ba3c2a' },
					success: { value: '#2a7042' },
				},
			},
		},
		semanticTokens: {
			colors: {
				link: {
					base: { value: '{colors.accent.600}' },
					hover: { value: '{colors.accent.700}' },
				},
				scroll: {
					track: { value: '{colors.dim.200}' },
					thumb: {
						base: { value: '{colors.sand.400}' },
						hover: { value: '{colors.sand.500}' },
					},
				},
				typography: {
					accent: { value: '{colors.accent.600}' },
					muted: { value: '{colors.accent.900}' },
				},
				skeleton: {
					start: { value: '{colors.accent.100}' },
					end: { value: '{colors.accent.200}' },
				},
				control: {
					base: {
						background: { value: '{colors.sand.300}' },
						foreground: { value: '{colors.typography.base}' },
						active: { background: { value: '{colors.sand.400}' } },
						disabled: { background: { value: '{colors.sand.100}' } },
					},
					action: {
						foreground: { value: '#ffffff' },
						background: { value: '{colors.accent.500}' },
						active: { background: { value: '{colors.accent.600}' } },
					},
					input: {
						focusRing: { value: '{colors.accent.400}' },
						background: { value: '{colors.sand.100}' },
						border: { value: '{colors.sand.300}' },
						active: { border: { value: '{colors.accent.400}' } },
					},
					ghost: {
						foreground: { value: '{colors.typography.base}' },
						background: { value: 'transparent' },
						hover: {
							foreground: { value: '{colors.typography.base}' },
							background: { value: '{colors.sand.200}' },
						},
						active: {
							foreground: { value: '{colors.typography.base}' },
							background: { value: '{colors.sand.300}' },
						},
					},
					option: {
						foreground: { value: '{colors.typography.base}' },
						background: { value: 'transparent' },
						hover: {
							foreground: { value: '{colors.typography.base}' },
							background: { value: '{colors.sand.200}' },
						},
						active: {
							foreground: { value: '{colors.typography.base}' },
							background: { value: '{colors.sand.300}' },
						},
					},
				},
				container: {
					head: {
						foreground: { value: '{colors.typography.base}' },
						background: { value: '{colors.surface.panel}' },
					},
					message: {
						foreground: { value: '{colors.typography.base}' },
						background: { value: '{colors.sand.100}' },
					},
				},
				code: {
					token: {
						comment: { value: '#8c8578' },
						punctuation: { value: '#8f6445' },
						property: { value: '#a3573c' },
						selector: { value: '#a34832' },
						operator: { value: '#b54d32' },
						attr: { value: '#8f382a' },
						variable: { value: '#9e5944' },
						function: { value: '#ab5c46' },
					},
				},
				scheme: {
					alert: {
						text: { value: '#ffffff' },
						base: { value: '{colors.message.error}' },
						hover: { value: '#942b1e' },
					},
				},
			},
		},
	},
});
