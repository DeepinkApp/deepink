import { defineConfig } from '@chakra-ui/react';

export default defineConfig({
	theme: {
		tokens: {
			colors: {
				accent: {
					100: { value: '#ddccbd' },
					200: { value: '#ffd5b2' },
					300: { value: '#f9caa2' },
					500: { value: '#94481c' },
					700: { value: '#ae7f5f' },
				},
				typography: {
					base: { value: '#000' },
					secondary: { value: '#4e3a0c' },
					inverted: { value: '#fff' },
				},
				selection: {
					foreground: { value: '#000' },
					background: { value: '#ffca9b' },
				},
				highlight: {
					foreground: { value: '#000' },
					background: { value: '#ffba7d' },
				},
				surface: {
					background: { value: '#fffaf3' },
					invertedBackground: { value: '#000' },
					panel: { value: '#f8f2e9' },
					border: { value: '#e0d6c7' },
				},
				dim: {
					50: { value: '#d6ab7d10' },
					100: { value: '#d6ab7d17' },
					200: { value: '#d6ab7d25' },
					400: { value: '#d6ab7d3c' },
					500: { value: '#d6ab7d3c' },
				},
				overlay: {
					500: { value: '#00000075' },
				},
				message: {
					error: { value: '#b30606' },
					success: { value: '#3ea863' },
				},
			},
			shadows: {
				input: { value: '0 0 0 3px #ffd5b2' },
				outline: { value: '0 0 0 3px #ffd5b2' },
			},
		},
		semanticTokens: {
			colors: {
				link: {
					base: { value: '{colors.accent.500}' },
					hover: { value: '{colors.accent.700}' },
				},
				typography: {
					accent: { value: '{colors.accent.500}' },
				},
				control: {
					base: {
						background: { value: '{colors.dim.200}' },
						foreground: { value: '{colors.typography.base}' },
						active: { background: { value: '{colors.dim.400}' } },
						disabled: { background: { value: '{colors.dim.100}' } },
					},
					action: {
						foreground: { value: '{colors.accent.500}' },
						background: { value: '{colors.accent.200}' },
						active: { background: { value: '{colors.accent.300}' } },
					},
					input: {
						background: { value: '{colors.dim.200}' },
						border: { value: 'transparent' },
						active: { border: { value: '{colors.dim.500}' } },
					},
					ghost: {
						foreground: { value: '{colors.typography.base}' },
						background: { value: 'transparent' },
						hover: {
							foreground: { value: '{colors.typography.base}' },
							background: { value: '{colors.dim.400}' },
						},
						active: {
							foreground: { value: '{colors.typography.base}' },
							background: { value: '{colors.dim.400}' },
						},
					},
					option: {
						foreground: { value: '{colors.typography.base}' },
						background: { value: 'transparent' },
						hover: {
							foreground: { value: '{colors.typography.base}' },
							background: { value: '{colors.dim.400}' },
						},
						active: {
							foreground: { value: '{colors.typography.base}' },
							background: { value: '{colors.dim.400}' },
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
						background: { value: '{colors.dim.100}' },
					},
				},
				code: {
					token: {
						comment: { value: '#a5674e' },
						punctuation: { value: '#9c5f1c' },
						property: { value: '#ac4e04' },
						selector: { value: '#ac4e04' },
						operator: { value: '#e14e12' },
						attr: { value: '#bf3903' },
						variable: { value: '#d46f0f' },
						function: { value: '#d46f0f' },
					},
				},
				scheme: {
					alert: {
						text: { value: '#fff' },
						base: { value: '#C53030' },
						hover: { value: '#9B2C2C' },
					},
				},
			},
		},
	},
});
