import { getScrollBarStyles } from '../../base';
import { buildColorScheme } from '../../color';

export default function (accentColor: string) {
	const colors = buildColorScheme(accentColor);

	return {
		styles: {
			global: {
				...getScrollBarStyles(),
			},
		},
		shadows: {
			outline: `0 0 0 3px ${colors.accentVariants['500']}`,
			input: `0 0 0 3px ${colors.accentVariants['500']}`,
		},
		colors: {
			accent: colors.accentVariants,
			typography: {
				base: '#000',
				secondary: '#5f5f5f',
				accent: colors.accentVariants['500'],
				inverted: '#fff',
				invertedAccent: colors.getContrastForeground(
					colors.accentVariants['500'],
				),
			},
			selection: {
				foreground: colors.getContrastForeground(colors.accentVariants['200']),
				background: colors.accentVariants['200'],
			},
			highlight: {
				foreground: colors.getContrastForeground(colors.accentVariants['200']),
				background: colors.accentVariants['200'],
			},
			surface: {
				background: '#ffffff',
				invertedBackground: '#000',
				panel: '#f9f9f996',
				border: '#e2e8f0',
			},
			dim: {
				50: '#00000005',
				100: '#0000000a',
				200: '#00000010',
				400: '#00000017',
				500: '#00000030',
			},
			link: {
				base: colors.accentVariants['500'],
				hover: colors.accentVariants['600'],
			},
			overlay: {
				500: '#00000075',
			},
			message: {
				error: '#b30606',
				success: '#3ea863',
			},
		},
		semanticTokens: {
			colors: {
				control: {
					base: {
						background: 'dim.200',
						foreground: 'typography.base',

						active: {
							background: 'dim.400',
						},

						disabled: {
							background: 'dim.200',
						},
					},

					action: {
						foreground: 'typography.invertedAccent',
						background: 'accent.500',

						active: {
							background: 'accent.600',
						},
					},

					input: {
						background: 'dim.100',
						border: 'transparent',

						active: {
							border: 'dim.400',
						},
					},
					ghost: {
						foreground: 'typography.base',
						background: 'transparent',

						hover: {
							foreground: 'typography.base',
							background: 'dim.200',
						},

						active: {
							foreground: 'typography.base',
							background: 'dim.200',
						},
					},
					option: {
						foreground: 'typography.base',
						background: 'transparent',

						hover: {
							foreground: 'typography.base',
							background: 'dim.200',
						},

						active: {
							foreground: 'typography.base',
							background: 'dim.200',
						},
					},
				},
				container: {
					head: {
						foreground: 'typography.base',
						background: 'surface.panel',
					},

					message: {
						foreground: 'typography.base',
						background: 'dim.100',
					},
				},
				code: {
					token: {
						comment: '#a5674e',
						punctuation: '#9c5f1c',
						property: '#ac4e04',
						selector: '#ac4e04',
						operator: '#e14e12',
						attr: '#df4c11',
						variable: '#e90',
						function: '#ff8300',
					},
				},
			},
			scheme: {
				alert: {
					text: '#fff',
					base: '#C53030',
					hover: '#9B2C2C',
				},
			},
		},
	};
}
