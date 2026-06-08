import { defineConfig } from '@chakra-ui/react';

import { buildColorScheme } from '../../color';

export default function (accentColor: string) {
	const colors = buildColorScheme(accentColor);
	const accent = colors.accentVariants;

	return defineConfig({
		theme: {
			tokens: {
				colors: {
					accent: Object.fromEntries(
						Object.entries(accent).map(([k, v]) => [k, { value: v }]),
					),
					typography: {
						base: { value: '#e2e2e2' },
						muted: { value: '#fde7fd' },
						secondary: { value: '#c7c7c7' },
						accent: { value: accent['500'] },
						inverted: { value: '#000' },
						invertedAccent: {
							value: colors.getContrastForeground(accent['500']),
						},
					},
					selection: {
						foreground: {
							value: colors.getContrastForeground(accent['200']),
						},
						background: { value: accent['200'] },
					},
					highlight: {
						foreground: {
							value: colors.getContrastForeground(accent['300']),
						},
						background: { value: accent['300'] },
					},
					surface: {
						background: { value: '#2c272c' },
						invertedBackground: { value: '#fff' },
						panel: { value: '#393139' },
						border: { value: '#3a353a' },
						muted: { value: '{colors.dim.200}' },
					},
					dim: {
						50: { value: '#6c65659c' },
						100: { value: '#6c6565b9' },
						200: { value: '#6c6565c6' },
						400: { value: '#6c65658a' },
						500: { value: '#d5d5d530' },
					},
					link: {
						base: { value: accent['400'] },
						hover: { value: accent['500'] },
					},
					overlay: {
						500: { value: '#ffffff75' },
					},
					message: {
						error: { value: '#b30606' },
						success: { value: '#3ea863' },
					},
					focusRing: { value: accent['400'] },
				},
				shadows: {
					outline: { value: `0 0 0 3px ${accent['400']}` },
					input: { value: `0 0 0 3px ${accent['400']}` },
				},
			},
			semanticTokens: {
				colors: {
					control: {
						base: {
							background: { value: '{colors.dim.50}' },
							foreground: { value: '{colors.typography.base}' },
							active: { background: { value: '{colors.dim.100}' } },
							disabled: { background: { value: '{colors.dim.200}' } },
						},
						action: {
							foreground: {
								value: '{colors.typography.invertedAccent}',
							},
							background: { value: '{colors.accent.500}' },
							active: { background: { value: '{colors.accent.600}' } },
						},
						input: {
							focusRing: { value: accent['400'] },
							background: { value: '{colors.dim.100}' },
							border: { value: 'transparent' },
							active: { border: { value: '{colors.dim.400}' } },
						},
						ghost: {
							foreground: { value: '{colors.typography.base}' },
							background: { value: 'transparent' },
							hover: {
								foreground: { value: '{colors.typography.base}' },
								background: { value: '{colors.dim.200}' },
							},
							active: {
								foreground: { value: '{colors.typography.base}' },
								background: { value: '{colors.dim.200}' },
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
					scroll: {
						track: { value: '{colors.dim.200}' },
						thumb: {
							base: { value: '{colors.dim.400}' },
							hover: { value: '{colors.dim.500}' },
						},
					},
					skeleton: {
						start: { value: '{colors.dim.200}' },
						end: { value: '{colors.dim.400}' },
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
							comment: { value: '#ffe0c6' },
							punctuation: { value: '#ffb496' },
							property: { value: '#ff7b00' },
							selector: { value: '#ffbf8d' },
							operator: { value: '#ffbfa5' },
							attr: { value: '#ff6628' },
							variable: { value: '#e90' },
							function: { value: '#ff976c' },
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
}
