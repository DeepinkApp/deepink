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
						base: { value: '#000' },
						muted: { value: '#51424c' },
						secondary: { value: '#5f5f5f' },
						accent: { value: accent['500'] },
						inverted: { value: '#fff' },
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
							value: colors.getContrastForeground(accent['200']),
						},
						background: { value: accent['200'] },
					},
					surface: {
						background: { value: '#ffffff' },
						invertedBackground: { value: '#000' },
						panel: { value: '#f9f9f996' },
						border: { value: '#e2e8f0' },
						muted: { value: '{colors.dim.200}' },
					},
					dim: {
						50: { value: '#00000005' },
						100: { value: '#0000000a' },
						200: { value: '#00000010' },
						400: { value: '#00000017' },
						500: { value: '#00000030' },
					},
					link: {
						base: { value: accent['500'] },
						hover: { value: accent['600'] },
					},
					overlay: {
						500: { value: '#00000075' },
					},
					message: {
						error: { value: '#b30606' },
						success: { value: '#3ea863' },
					},
					focusRing: { value: accent['500'] },
				},
				shadows: {
					outline: { value: `0 0 0 3px ${accent['500']}` },
					input: { value: `0 0 0 3px ${accent['500']}` },
				},
			},
			semanticTokens: {
				colors: {
					control: {
						base: {
							background: { value: '{colors.dim.200}' },
							foreground: { value: '{colors.typography.base}' },
							active: { background: { value: '{colors.dim.400}' } },
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
							focusRing: { value: accent['500'] },
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
								background: { value: '{colors.dim.200}' },
							},
							active: {
								foreground: { value: '{colors.typography.base}' },
								background: { value: '{colors.dim.200}' },
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
							comment: { value: '#a5674e' },
							punctuation: { value: '#9c5f1c' },
							property: { value: '#ac4e04' },
							selector: { value: '#ac4e04' },
							operator: { value: '#e14e12' },
							attr: { value: '#df4c11' },
							variable: { value: '#e90' },
							function: { value: '#ff8300' },
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
