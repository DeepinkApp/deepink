/*
 ============================================================
 CHAKRA UI v3 - DEFINE RECIPES
 ============================================================

 Component styling in v3 uses defineRecipe (single-part)
 and defineSlotRecipe (multi-part) instead of the old
 defineStyleConfig and createMultiStyleConfigHelpers.

 Documentation:
 - Recipes: https://chakra-ui.com/docs/theming/recipes
 - Slot Recipes: https://chakra-ui.com/docs/theming/slot-recipes

 ============================================================
*/
/* eslint-disable @cspell/spellchecker */
import {
	defineConfig,
	defineRecipe,
	defineSlotRecipe,
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
} = {}): Record<string, any> => {
	const styles: Record<string, any> = {
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
	};
};

export default defineConfig({
	globalCss: {
		body: {
			background: 'surface.background',
			margin: 0,
			color: 'typography.base',
			fontFamily: `-apple-system,
			blinkmacsystemfont,
			'Segoe UI',
			'Noto Sans',
			helvetica,
			arial,
			sans-serif,
			'Apple Color Emoji',
			'Segoe UI Emoji'`,
		},

		':root': {
			'::selection': {
				color: 'selection.foreground',
				backgroundColor: 'selection.background',
			},

			'[data-resize-handle]': {
				'--resize-handle-active-color': 'var(--chakra-colors-accent-300)',
			},

			...(getScrollBarStyles() as SystemStyleObject),

			'select:focus-visible, button:focus-visible, input:focus-visible': {
				boxShadow: 'outline',
			},
		} as SystemStyleObject,
	},

	theme: {
		recipes: {
			Progress: defineRecipe({
				variants: {
					success: {
						'& [data-part="filled-track"]': {
							bgColor: 'message.success',
						},
					},
					alert: {
						'& [data-part="filled-track"]': {
							bgColor: 'message.error',
						},
					},
				},
			}),
			Text: defineRecipe({
				base: {
					color: 'typography.base',
				},
				variants: {
					variant: {
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
				},
			}),
			Link: defineRecipe({
				base: {
					color: 'link.base',
					'&:hover, &:active': {
						color: 'link.hover',
					},
				},
			}),
			Button: defineRecipe({
				base: {
					'&:not([data-no-animation])': {
						transition: 'transform .20ms ease',
						'&:not(:disabled):active': {
							transform: 'scale(.95)',
						},
					},
				},
				variants: {
					variant: {
						accent: {
							color: 'control.action.foreground',
							backgroundColor: 'control.action.background',

							'&:hover': {
								backgroundColor: 'control.action.active.background',
							},
							'&:disabled, &:hover[disabled]': {
								backgroundColor: 'control.action.background',
							},
						},
						alert: {
							color: 'white',
							backgroundColor: '{colors.scheme.alert.base}',

							'&:hover': {
								backgroundColor: '{colors.scheme.alert.hover}',
							},
							'&:disabled, &:hover[disabled]': {
								backgroundColor: '{colors.scheme.alert.base}',
							},
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
				},
				defaultVariants: {
					variant: 'subtle',
				},
			}),
			Tooltip: defineRecipe({
				base: {
					borderRadius: '4px',
					color: 'typography.inverted',
					backgroundColor: 'surface.invertedBackground',
					'--popper-arrow-bg':
						'var(--chakra-colors-surface-invertedBackground)',
				},
			}),
			Spinner: defineRecipe({
				variants: {
					variant: {
						accent: {
							color: 'control.action.background',
						},
					},
				},
				defaultVariants: {
					variant: 'accent',
				},
			}),
			Divider: defineRecipe({
				base: {
					borderColor: 'surface.border',
				},
			}),
		},
		slotRecipes: {
			Input: defineSlotRecipe({
				slots: ['field', 'addon', 'element'],
				base: {
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
				variants: {
					size: {
						lg: {
							field: {
								borderWidth: '2px',
							},
						},
					},
					variant: {
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
				},
				defaultVariants: {
					variant: 'subtle',
				},
			}),
			Select: defineSlotRecipe({
				slots: ['field', 'icon'],
				base: {
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
					variant: {
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
				},
				defaultVariants: {
					variant: 'subtle',
				},
			}),
			Switch: defineSlotRecipe({
				slots: ['container', 'thumb', 'track', 'label'],
				base: {
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
			Menu: defineSlotRecipe({
				slots: ['button', 'list', 'item'],
				base: {
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
			List: defineSlotRecipe({
				slots: ['container', 'item'],
				base: {
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
			}),
			Tag: defineSlotRecipe({
				slots: ['container'],
				variants: {
					variant: {
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
				},
				defaultVariants: {
					variant: 'base',
				},
			}),
			Alert: defineSlotRecipe({
				slots: ['icon', 'container'],
				base: {
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
			Tabs: defineSlotRecipe({
				slots: ['tab'],
				variants: {
					variant: {
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
				},
				defaultVariants: {
					variant: 'subtle',
				},
			}),
			Modal: defineSlotRecipe({
				slots: ['overlay', 'dialog', 'closeButton'],
				base: {
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
			Slider: defineSlotRecipe({
				slots: ['container', 'track', 'filledTrack', 'thumb', 'mark'],
				base: {
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
				variants: {
					size: {
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
					variant: {
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
				},
				defaultVariants: {
					variant: 'solid',
					size: 'md',
				},
			}),
			Notifications: NotificationsTheme,
			NotePreview: NotePreviewTheme,
			NestedList: NestedListTheme,
			RichEditor: RichEditorTheme,
		},
	},
});
