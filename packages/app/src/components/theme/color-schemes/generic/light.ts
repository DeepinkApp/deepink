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
					'typography.base': { value: '#000' },
					'typography.secondary': { value: '#5f5f5f' },
					'typography.accent': { value: accent['500'] },
					'typography.inverted': { value: '#fff' },
					'typography.invertedAccent': {
						value: colors.getContrastForeground(accent['500']),
					},
					'selection.foreground': {
						value: colors.getContrastForeground(accent['200']),
					},
					'selection.background': { value: accent['200'] },
					'highlight.foreground': {
						value: colors.getContrastForeground(accent['200']),
					},
					'highlight.background': { value: accent['200'] },
					'surface.background': { value: '#ffffff' },
					'surface.invertedBackground': { value: '#000' },
					'surface.panel': { value: '#f9f9f996' },
					'surface.border': { value: '#e2e8f0' },
					'dim.50': { value: '#00000005' },
					'dim.100': { value: '#0000000a' },
					'dim.200': { value: '#00000010' },
					'dim.400': { value: '#00000017' },
					'dim.500': { value: '#00000030' },
					'link.base': { value: accent['500'] },
					'link.hover': { value: accent['600'] },
					'overlay.500': { value: '#00000075' },
					'message.error': { value: '#b30606' },
					'message.success': { value: '#3ea863' },
				},
				shadows: {
					outline: { value: `0 0 0 3px ${accent['500']}` },
					input: { value: `0 0 0 3px ${accent['500']}` },
				},
			},
			semanticTokens: {
				colors: {
					'control.base.background': { value: '{colors.dim.200}' },
					'control.base.foreground': { value: '{colors.typography.base}' },
					'control.base.active.background': { value: '{colors.dim.400}' },
					'control.base.disabled.background': { value: '{colors.dim.200}' },
					'control.action.foreground': {
						value: '{colors.typography.invertedAccent}',
					},
					'control.action.background': { value: '{colors.accent.500}' },
					'control.action.active.background': { value: '{colors.accent.600}' },
					'control.input.background': { value: '{colors.dim.100}' },
					'control.input.border': { value: 'transparent' },
					'control.input.active.border': { value: '{colors.dim.400}' },
					'control.ghost.foreground': { value: '{colors.typography.base}' },
					'control.ghost.background': { value: 'transparent' },
					'control.ghost.hover.foreground': {
						value: '{colors.typography.base}',
					},
					'control.ghost.hover.background': { value: '{colors.dim.200}' },
					'control.ghost.active.foreground': {
						value: '{colors.typography.base}',
					},
					'control.ghost.active.background': { value: '{colors.dim.200}' },
					'control.option.foreground': { value: '{colors.typography.base}' },
					'control.option.background': { value: 'transparent' },
					'control.option.hover.foreground': {
						value: '{colors.typography.base}',
					},
					'control.option.hover.background': { value: '{colors.dim.200}' },
					'control.option.active.foreground': {
						value: '{colors.typography.base}',
					},
					'control.option.active.background': { value: '{colors.dim.200}' },
					'container.head.foreground': { value: '{colors.typography.base}' },
					'container.head.background': { value: '{colors.surface.panel}' },
					'container.message.foreground': { value: '{colors.typography.base}' },
					'container.message.background': { value: '{colors.dim.100}' },
					'code.token.comment': { value: '#a5674e' },
					'code.token.punctuation': { value: '#9c5f1c' },
					'code.token.property': { value: '#ac4e04' },
					'code.token.selector': { value: '#ac4e04' },
					'code.token.operator': { value: '#e14e12' },
					'code.token.attr': { value: '#df4c11' },
					'code.token.variable': { value: '#e90' },
					'code.token.function': { value: '#ff8300' },
					'scheme.alert.text': { value: '#fff' },
					'scheme.alert.base': { value: '#C53030' },
					'scheme.alert.hover': { value: '#9B2C2C' },
				},
			},
		},
	});
}
