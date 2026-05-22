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
					'typography.base': { value: '#e2e2e2' },
					'typography.secondary': { value: '#c7c7c7' },
					'typography.accent': { value: accent['500'] },
					'typography.inverted': { value: '#000' },
					'typography.invertedAccent': {
						value: colors.getContrastForeground(accent['500']),
					},
					'selection.foreground': {
						value: colors.getContrastForeground(accent['200']),
					},
					'selection.background': { value: accent['200'] },
					'highlight.foreground': {
						value: colors.getContrastForeground(accent['300']),
					},
					'highlight.background': { value: accent['300'] },
					'surface.background': { value: '#2c272c' },
					'surface.invertedBackground': { value: '#fff' },
					'surface.panel': { value: '#393139' },
					'surface.border': { value: '#3a353a' },
					'dim.50': { value: '#6c65659c' },
					'dim.100': { value: '#6c6565b9' },
					'dim.200': { value: '#6c6565c6' },
					'dim.400': { value: '#6c65658a' },
					'dim.500': { value: '#d5d5d530' },
					'link.base': { value: accent['400'] },
					'link.hover': { value: accent['500'] },
					'overlay.500': { value: '#ffffff75' },
					'message.error': { value: '#b30606' },
					'message.success': { value: '#3ea863' },
				},
				shadows: {
					outline: { value: `0 0 0 3px ${accent['400']}` },
					input: { value: `0 0 0 3px ${accent['400']}` },
				},
			},
			semanticTokens: {
				colors: {
					'control.base.background': { value: '{colors.dim.50}' },
					'control.base.foreground': { value: '{colors.typography.base}' },
					'control.base.active.background': { value: '{colors.dim.100}' },
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
					'control.option.hover.background': { value: '{colors.dim.400}' },
					'control.option.active.foreground': {
						value: '{colors.typography.base}',
					},
					'control.option.active.background': { value: '{colors.dim.400}' },
					'container.head.foreground': { value: '{colors.typography.base}' },
					'container.head.background': { value: '{colors.surface.panel}' },
					'container.message.foreground': { value: '{colors.typography.base}' },
					'container.message.background': { value: '{colors.dim.100}' },
					'code.token.comment': { value: '#ffe0c6' },
					'code.token.punctuation': { value: '#ffb496' },
					'code.token.property': { value: '#ff7b00' },
					'code.token.selector': { value: '#ffbf8d' },
					'code.token.operator': { value: '#ffbfa5' },
					'code.token.attr': { value: '#ff6628' },
					'code.token.variable': { value: '#e90' },
					'code.token.function': { value: '#ff976c' },
					'scheme.alert.text': { value: '#fff' },
					'scheme.alert.base': { value: '#C53030' },
					'scheme.alert.hover': { value: '#9B2C2C' },
				},
			},
		},
	});
}
