/* eslint-disable @cspell/spellchecker */
import { progressAnatomy } from '@chakra-ui/anatomy';
import {
	createMultiStyleConfigHelpers,
	defineStyleConfig,
	extendTheme,
	StyleFunctionProps,
	SystemStyleObject,
} from '@chakra-ui/react';
import { NestedListTheme } from '@components/NestedList/NestedList.theme';
import { NotePreviewTheme } from '@components/NotePreview/NotePreview.theme';
import { NotificationsTheme } from '@components/Notifications/Notifications.theme';
import { RichEditorTheme } from '@features/NoteEditor/RichEditor/RichEditor.theme';

import './resizable-panels.css';

export const getScrollBarStyles = ({
	trackColor = '#f1f1f1',
	scrollColor = '#c5c5c5',
	scrollHoverColor = '#939393',
}: {
	trackColor?: string;
	scrollColor?: string;
	scrollHoverColor?: string;
} = {}) => {
	const styles: SystemStyleObject = {
		'.invisible-scroll::-webkit-scrollbar': {
			display: 'none',
		},
	};

	// Disable custom scrolls for some environments
	if (navigator.userAgent.includes('Mac OS')) return styles;

	// TODO: automatically hide scroll bar when not needed
	return {
		...styles,

		'::-webkit-scrollbar': {
			width: '10px',
			// For horizontal scroll
			height: '10px',
		},

		'::-webkit-scrollbar-track': {
			background: trackColor,
			borderRadius: '0px',
			border: '1px solid transparent',
		},

		'::-webkit-scrollbar-thumb': {
			background: scrollColor,
			borderRadius: '0px',
			border: '0px solid transparent',
			backgroundClip: 'padding-box',
		},

		'::-webkit-scrollbar-thumb:hover': {
			background: scrollHoverColor,
		},
	} satisfies SystemStyleObject;
};

export default extendTheme({
	styles: {
		global: {
			fontFamily: `-apple-system,
			blinkmacsystemfont,
			'Segoe UI',
			'Noto Sans',
			helvetica,
			arial,
			sans-serif,
			'Apple Color Emoji',
			'Segoe UI Emoji'`,

			body: {
				background: 'surface.background',
				margin: 0,
				color: 'typography.base',
			},

			'::selection': {
				color: 'selection.foreground',
				backgroundColor: 'selection.background',
			},

			'[data-resize-handle]': {
				'--resize-handle-active-color': 'var(--chakra-colors-accent-300)',
			},

			...getScrollBarStyles(),

			'select:focus-visible, button:focus-visible, input:focus-visible, ': {
				boxShadow: 'outline',
			},
		},
	},
	components: {
		Progress: createMultiStyleConfigHelpers(
			progressAnatomy.keys,
		).defineMultiStyleConfig({
			variants: {
				success: {
					filledTrack: {
						bgColor: 'message.success',
					},
				},
				alert: {
					filledTrack: {
						bgColor: 'message.error',
					},
				},
			},
		}),
		Text: defineStyleConfig({
			baseStyle: {
				color: 'typography.base',
			},
			variants: {
				secondary: {
					color: 'typography.secondary',
				},
				highlight: {
					backgroundColor: 'highlight.background',
					color: 'highlight.foreground',
				},
				error: {
					color: 'message.error',
				},
			},
		}),
		Link: defineStyleConfig({
			baseStyle: {
				color: 'link.base',
				'&:hover, &:active': {
					color: 'link.hover',
				},
			},
		}),
		Button: defineStyleConfig({
			baseStyle: {
				'&:not([data-no-animation])': {
					transition: 'transform .20ms ease',
					'&:not(:disabled):active': {
						transform: 'scale(.95)',
					},
				},
			},
			variants: {
				accent(props: StyleFunctionProps) {
					const scheme = props.theme.semanticTokens.scheme[props.colorScheme];
					const colors: {
						text: string;
						base: string;
						hover: string;
					} = scheme || {
						text: 'control.action.foreground',
						base: 'control.action.background',
						hover: 'control.action.active.background',
					};

					return {
						color: colors.text,
						backgroundColor: colors.base,

						'&:hover': {
							backgroundColor: colors.hover,
						},
						'&:disabled, &:hover[disabled]': {
							backgroundColor: colors.base,
						},
					};
				},

				subtle: {
					color: 'control.base.foreground',
					backgroundColor: 'control.base.background',

					'&[disabled], &:hover, &[disabled]:hover': {
						backgroundColor: 'control.base.disabled.background',
					},
					'&[data-active], &:not([disabled]):hover': {
						backgroundColor: 'control.base.active.background',
					},
				},

				ghost: {
					color: 'control.ghost.foreground',
					backgroundColor: 'control.ghost.background',

					'&:not([data-active]):is(:hover,:active)': {
						color: 'control.ghost.hover.foreground',
						backgroundColor: 'control.ghost.hover.background',
					},

					'&[data-active]': {
						color: 'control.ghost.active.foreground',
						background: 'control.ghost.active.background',
					},
				},

				link: {
					color: 'link.base',
					backgroundColor: 'unset',

					textDecoration: 'underline',
					textUnderlineOffset: '.2em',
					padding: 0,
					fontWeight: 'normal',
					fontSize: 'inherit',
					alignItems: 'baseline',

					'&:hover, &:active, &[data-active]': {
						color: 'link.base',
					},
					'&:not(:disabled):active': {
						transform: 'none',
					},
				},
			},
			defaultProps: {
				variant: 'subtle',
			},
		}),
		Input: createMultiStyleConfigHelpers([
			'field',
			'addon',
			'element',
		]).defineMultiStyleConfig({
			baseStyle: {
				field: {
					color: 'typography.base',
					borderRadius: '6px',
					'&::placeholder': {
						color: 'typography.secondary',
						opacity: '.8',
					},

					'&:focus-visible, &[data-focus-visible]': {
						shadow: 'input',
					},

					// Make chars in password input larger
					'&[type=password]:not(:placeholder-shown)': {
						fontFamily: 'Verdana',
						fontWeight: 'bold',
						letterSpacing: '0.05em',
					},
				},
			},
			sizes: {
				lg: {
					field: {
						borderWidth: '2px',
					},
				},
			},
			variants: {
				subtle: {
					field: {
						borderColor: 'control.input.border',
						borderWidth: '1px',

						'&:hover': {
							borderColor: 'control.input.active.border',
						},
						'&:focus': {
							borderColor: 'control.input.border',
							backgroundColor: 'transparent',
						},
						'&:not(:focus)': {
							backgroundColor: 'control.input.background',
						},
					},
				},
				flushed: {
					field: {
						background: 'transparent',
						boxShadow: 'none',
						padding: '.3rem',

						borderWidth: '0 0 1px',
						borderColor: 'transparent',
						borderRadius: 0,

						'&:hover, &:focus, &:focus-visible': {
							background: 'transparent',
							borderColor: 'control.input.active.border',
						},
						'&:focus-visible': {
							boxShadow: 'none',
						},
					},
				},
			},
			defaultProps: {
				variant: 'subtle',
			},
		}),
		Select: createMultiStyleConfigHelpers(['field', 'icon']).defineMultiStyleConfig({
			baseStyle: {
				field: {
					color: 'typography.base',
					borderRadius: '6px',
					'&::placeholder': {
						color: 'inherit',
						opacity: '.8',
					},

					'& option': {
						backgroundColor: 'surface.background',
					},
				},
			},
			variants: {
				subtle: {
					field: {
						backgroundColor: 'control.base.background',
						color: 'control.base.foreground',

						'&:hover': {
							backgroundColor: 'control.base.active.background',
						},
					},
				},
			},
			defaultProps: {
				variant: 'subtle',
			},
		}),
		Switch: createMultiStyleConfigHelpers([
			'container',
			'thumb',
			'track',
			'label',
		]).defineMultiStyleConfig({
			baseStyle: {
				container: {
					display: 'inline-flex',
					maxWidth: '100%',
					lineHeight: '1',
				},
				label: {
					overflow: 'hidden',
					whiteSpace: 'nowrap',
					textOverflow: 'ellipsis',
				},
				track: {
					backgroundColor: 'dim.500',
					_checked: {
						backgroundColor: 'control.action.background',
					},
				},
				thumb: {
					backgroundColor: 'control.action.foreground',
				},
			},
		}),
		Menu: createMultiStyleConfigHelpers([
			'button',
			'list',
			'item',
		]).defineMultiStyleConfig({
			baseStyle: {
				list: {
					borderColor: 'surface.border',
					backgroundColor: 'surface.background',
				},
				item: {
					color: 'control.ghost.foreground',
					backgroundColor: 'transparent',

					transitionDuration: '0s',
					'&:hover, &:focus': {
						color: 'control.ghost.hover.foreground',
						backgroundColor: 'control.ghost.hover.background',
					},
				},
			},
		}),
		List: createMultiStyleConfigHelpers(['container', 'item']).defineMultiStyleConfig(
			{
				baseStyle: {
					list: {
						borderColor: 'surface.border',
						backgroundColor: 'surface.background',
					},
					item: {
						color: 'control.ghost.foreground',
						backgroundColor: 'transparent',

						'&[aria-selected=true]': {
							color: 'control.ghost.hover.foreground',
							backgroundColor: 'control.ghost.hover.background',
						},
					},
				},
			},
		),
		Tooltip: defineStyleConfig({
			baseStyle: {
				borderRadius: '4px',
				color: 'typography.inverted',
				backgroundColor: 'surface.invertedBackground',
				'--popper-arrow-bg': 'var(--chakra-colors-surface-invertedBackground)',
			},
		}),
		Tag: createMultiStyleConfigHelpers(['container']).defineMultiStyleConfig({
			variants: {
				base: {
					container: {
						backgroundColor: 'control.base.background',
						color: 'control.base.foreground',

						'&:hover': {
							backgroundColor: 'control.base.active.background',
						},
					},
				},
				static: {
					container: {
						backgroundColor: 'control.base.background',
						color: 'control.base.foreground',
					},
				},
			},
			defaultProps: {
				variant: 'base',
			},
		}),
		Alert: createMultiStyleConfigHelpers([
			'icon',
			'container',
		]).defineMultiStyleConfig({
			baseStyle: {
				icon: {
					color: 'currentColor',
				},
				container: {
					'&[data-status="info"]': {
						backgroundColor: 'container.message.background',
						color: 'container.message.foreground',
					},
				},
			},
		}),
		Tabs: createMultiStyleConfigHelpers(['tab']).defineMultiStyleConfig({
			variants: {
				subtle: {
					tab: {
						color: 'control.ghost.foreground',
						backgroundColor: 'transparent',

						'&:hover': {
							color: 'control.ghost.hover.foreground',
							backgroundColor: 'control.ghost.hover.background',
						},

						_selected: {
							color: 'control.ghost.active.foreground',
							background: 'control.ghost.active.background',
						},
					},
				},
			},
			defaultProps: {
				variant: 'subtle',
			},
		}),
		Spinner: defineStyleConfig({
			variants: {
				accent: {
					color: 'control.action.background',
				},
			},
			defaultProps: {
				variant: 'accent',
			},
		}),
		Divider: defineStyleConfig({
			baseStyle: {
				borderColor: 'surface.border',
			},
		}),
		Modal: createMultiStyleConfigHelpers([
			'overlay',
			'dialog',
			'closeButton',
		]).defineMultiStyleConfig({
			baseStyle: {
				overlay: {
					backgroundColor: 'overlay.500',
				},
				dialog: {
					color: 'typography.base',
					backgroundColor: 'surface.background',
				},
				closeButton: {
					_hover: {
						color: 'control.ghost.hover.foreground',
						backgroundColor: 'control.ghost.hover.background',
					},
				},
			},
		}),
		Slider: createMultiStyleConfigHelpers([
			'container',
			'track',
			'filledTrack',
			'thumb',
			'mark',
		]).defineMultiStyleConfig({
			baseStyle: {
				container: {
					height: '2rem',
				},
				track: {
					height: '.5rem',
					top: '20% !important',
				},
				thumb: {
					boxSize: '.8rem',
					top: '20% !important',
				},
				mark: {
					width: 'max-content',
					top: '35%',
				},
			},
			sizes: {
				sm: {
					container: {
						height: '2rem',
					},
					track: {
						height: '.3rem',
					},
					thumb: {
						boxSize: '.5rem',
					},
				},
				md: {
					container: {
						height: '2.5rem',
					},
					track: {
						height: '.5rem',
					},
					thumb: {
						boxSize: '.8rem',
					},
				},
			},
			variants: {
				solid: {
					track: {
						backgroundColor: 'control.base.background',
						borderRadius: '6px',
					},
					filledTrack: {
						backgroundColor: 'control.action.background',
					},
					thumb: {
						backgroundColor: 'control.action.foreground',
					},
				},
			},
			defaultProps: {
				variant: 'solid',
				size: 'md',
			},
		}),
		Notifications: NotificationsTheme,
		NotePreview: NotePreviewTheme,
		NestedList: NestedListTheme,
		RichEditor: RichEditorTheme,
	},
});
