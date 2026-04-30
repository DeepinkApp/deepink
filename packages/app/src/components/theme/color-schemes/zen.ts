import { getScrollBarStyles } from '../base';

export default {
	styles: {
		global: {
			...getScrollBarStyles({
				trackColor: '#e7e0d9',
				scrollColor: '#bbac9d',
				scrollHoverColor: '#a99a8c',
			}),
		},
	},
	shadows: {
		input: '0 0 0 3px #ffd5b2',
		outline: '0 0 0 3px #ffd5b2',
	},
	colors: {
		accent: {
			100: '#ddccbd',
			200: '#ffd5b2',
			300: '#f9caa2',
			500: '#94481c',
			700: '#ae7f5f',
		},
		typography: {
			base: '#000',
			secondary: '#4e3a0c',
			inverted: '#fff',
		},
		selection: {
			foreground: '#000',
			background: '#ffca9b',
		},
		highlight: {
			foreground: '#000',
			background: '#ffba7d',
		},
		surface: {
			background: '#fffaf3',
			invertedBackground: '#000',
			panel: '#f8f2e9',
			border: '#e0d6c7',
		},
		dim: {
			50: '#d6ab7d10',
			100: '#d6ab7d17',
			200: '#d6ab7d25',
			400: '#d6ab7d3c',
			500: '#d6ab7d3c',
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
			link: {
				base: 'accent.500',
				hover: 'accent.700',
			},

			typography: {
				accent: 'accent.500',
			},

			control: {
				base: {
					background: 'dim.200',
					foreground: 'typography.base',

					active: {
						background: 'dim.400',
					},

					disabled: {
						background: 'dim.100',
					},
				},

				action: {
					foreground: 'accent.500',
					background: 'accent.200',

					active: {
						background: 'accent.300',
					},
				},

				input: {
					background: 'dim.200',
					border: 'transparent',

					active: {
						border: 'dim.500',
					},
				},
				ghost: {
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
					comment: '#a5674e',
					punctuation: '#9c5f1c',
					property: '#ac4e04',
					selector: '#ac4e04',
					operator: '#e14e12',
					attr: '#bf3903',
					variable: '#d46f0f',
					function: '#d46f0f',
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
