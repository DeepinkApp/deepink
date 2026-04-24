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
			outline: `0 0 0 3px ${colors.accentVariants['400']}`,
			input: `0 0 0 3px ${colors.accentVariants['400']}`,
		},
		colors: {
			accent: colors.accentVariants,
			typography: {
				base: '#e2e2e2',
				secondary: '#c7c7c7',
				accent: colors.accentVariants['500'],
				inverted: '#000',
				invertedAccent: colors.getContrastForeground(
					colors.accentVariants['500'],
				),
			},
			selection: {
				foreground: colors.getContrastForeground(colors.accentVariants['200']),
				background: colors.accentVariants['200'],
			},
			highlight: {
				foreground: colors.getContrastForeground(colors.accentVariants['300']),
				background: colors.accentVariants['300'],
			},
			surface: {
				background: '#2c272c',
				invertedBackground: '#fff',
				panel: '#393139',
				border: '#3a353a',
			},
			dim: {
				50: '#6c65659c',
				100: '#6c6565b9',
				200: '#6c6565c6',
				400: '#6c65658a',
				500: '#d5d5d530',
			},
			link: {
				base: colors.accentVariants['400'],
				hover: colors.accentVariants['500'],
			},
			overlay: {
				500: '#ffffff75',
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
						background: 'dim.50',
						foreground: 'typography.base',

						active: {
							background: 'dim.100',
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
							background: 'dim.400',
						},

						active: {
							foreground: 'typography.base',
							background: 'dim.400',
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
						comment: '#ffe0c6',
						punctuation: '#ffb496',
						property: '#ff7b00',
						selector: '#ffbf8d',
						operator: '#ffbfa5',
						attr: '#ff6628',
						variable: '#e90',
						function: '#ff976c',
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
