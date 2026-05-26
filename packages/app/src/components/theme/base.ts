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
import {
	alertAnatomy,
	dialogAnatomy,
	listAnatomy,
	menuAnatomy,
	nativeSelectAnatomy,
	progressAnatomy,
	sliderAnatomy,
	switchAnatomy,
	tabsAnatomy,
	tagAnatomy,
	tooltipAnatomy,
} from '@chakra-ui/react/anatomy';
import { NestedListRecipe } from '@components/NestedList/NestedList.theme';
import { notePreviewRecipe } from '@components/NotePreview/NotePreview.theme';
import { NotificationsRecipe } from '@components/Notifications/Notifications.theme';
import { RichEditorRecipe } from '@features/NoteEditor/RichEditor/RichEditor.theme';

import './resizable-panels.css';

export const getScrollBarStyles = (): Record<string, any> => {
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
			background: 'scroll.track',
			borderRadius: '0px',
			border: '1px solid transparent',
		},

		'::-webkit-scrollbar-thumb': {
			background: 'scroll.thumb',
			borderRadius: '0px',
			border: '0px solid transparent',
			backgroundClip: 'padding-box',
		},

		'::-webkit-scrollbar-thumb:hover': {
			background: 'scroll.thumb.hover',
		},
	};
};

export default defineConfig({
	globalCss: {
		// "*": {
		// 	focusRingColor: "red.500 !important",
		// },
		body: {
			background: 'surface.background',
			margin: 0,
			color: 'typography',
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

			'select:focus-visible, button:focus-visible, input:focus-visible': {
				boxShadow: 'outline',
			},
		} as SystemStyleObject,
		...getScrollBarStyles(),
	},

	theme: {
		semanticTokens: {
			colors: {
				fg: {
					muted: { value: '{colors.typography.secondary}' },
				},
				bg: {
					muted: { value: '{colors.surface.muted}' },
				},
				border: { value: '{colors.surface.border}' },
				color: { palette: { focus: { ring: { value: '{colors.focusRing}' } } } },
			},
		},
		recipes: {
			text: defineRecipe({
				base: {
					color: 'typography',
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
			link: defineRecipe({
				variants: {
					variant: {
						plain: {
							color: 'link',
							'&:hover, &:active': {
								color: 'link.hover',
							},
						},
					},
				},
			}),
			button: defineRecipe({
				variants: {
					size: {
						md: {
							fontSize: 'md',
						},
						// TODO: review button sizes
						xs: {
							h: '28px',
						},
					},
					variant: {
						subtle: {
							color: 'control.foreground',
							backgroundColor: {
								base: 'control.background',
								_hover: 'control.active.background',
								_disabled: 'control.disabled.background',
							},
							_open: {
								backgroundColor: {
									base: 'control.active.background',
									_disabled: 'control.disabled.background',
								},
							},

							borderRadius: 'lg',
						},
						accent: {
							color: 'control.action.foreground',
							backgroundColor: 'control.action.background',

							_hover: {
								backgroundColor: 'control.action.active.background',
							},
							_disabled: {
								backgroundColor: 'control.action.background',
							},

							borderRadius: 'lg',
						},
						ghost: {
							color: {
								base: 'control.ghost.foreground',
								_hover: 'control.ghost.hover.foreground',
								_focusVisible: 'control.ghost.hover.foreground',
								_active: 'control.ghost.active.foreground',
								_expanded: 'control.ghost.active.foreground',
								_open: 'control.ghost.active.foreground',
							},
							backgroundColor: {
								base: 'control.ghost.background',
								_hover: 'control.ghost.hover.background',
								_active: 'control.ghost.active.background',
								_expanded: 'control.ghost.active.background',
								_open: 'control.ghost.active.background',
							},

							borderRadius: 'lg',
						},
						link: {
							color: {
								base: 'link',
								_hover: 'link.hover',
								_active: 'link.hover',
							},
							backgroundColor: 'unset',

							height: 'auto',
							padding: 0,
							verticalAlign: 'unset',
							fontWeight: 'normal',
							fontSize: 'inherit',
							alignItems: 'baseline',

							_active: {
								textDecoration: 'underline',
							},
						},
						alert: {
							color: 'white',
							backgroundColor: '{colors.scheme.alert}',

							_hover: {
								backgroundColor: '{colors.scheme.alert.hover}',
							},
							_disabled: {
								backgroundColor: '{colors.scheme.alert}',
							},
						},
					},
				},
				defaultVariants: {
					variant: 'subtle',
				},
			}),

			input: defineRecipe({
				base: {
					color: 'typography',
					borderRadius: 'lg',
					'&::placeholder': {
						color: 'typography.secondary',
						opacity: '.8',
					},

					_focusVisible: {
						focusRingColor: 'control.input.focusRing',
						focusRingWidth: '3px',
					},

					// Make chars in password input larger
					'&[type=password]:not(:placeholder-shown)': {
						fontFamily: 'Verdana',
						fontWeight: 'bold',
						letterSpacing: '0.05em',
					},

					// Disable HTML5 number input’s spin box
					'&::-webkit-inner-spin-button': {
						// @ts-expect-error with "display:none" mouse scroll does not work - see https://stackoverflow.com/a/4298216
						'-webkit-appearance': 'none',
						// Apparently some margin are still there even though it's hidden
						margin: 0,
					},
				},
				variants: {
					size: {
						md: {
							fontSize: 'md',
						},
						lg: {
							borderWidth: '2px',
						},
					},
					variant: {
						subtle: {
							borderWidth: '1px',

							borderColor: 'control.input.border',
							backgroundColor: 'control.input.background',

							_hover: {
								'&:not(:focus-visible)': {
									borderColor: 'control.input.active.border',
									backgroundColor: 'control.input.background',
								},
							},

							_focus: {
								backgroundColor: 'transparent',
								borderColor: 'control.input.border',
							},
						},
						flushed: {
							background: 'transparent',
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
				defaultVariants: {
					variant: 'subtle',
				},
			}),
			separator: defineRecipe({
				base: {
					borderColor: 'surface.border',
				},
			}),
			spinner: defineRecipe({
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
			skeleton: defineRecipe({
				variants: {
					variant: {
						shine: {
							'--start-color': 'colors.skeleton.start',
							'--end-color': 'colors.skeleton.end',
						},
					},
				},
				defaultVariants: {
					variant: 'shine',
				},
			}),
		},
		slotRecipes: {
			nativeSelect: defineSlotRecipe({
				slots: nativeSelectAnatomy.keys(),
				base: {
					field: {
						color: 'typography',
						borderRadius: 'md',
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
								color: 'control.foreground',
								backgroundColor: {
									base: 'control.background',
									_hover: 'control.active.background',
								},
							},
						},
					},
				},
				defaultVariants: {
					variant: 'subtle',
				},
			}),
			switch: defineSlotRecipe({
				slots: switchAnatomy.keys(),
				variants: {
					variant: {
						solid: {
							root: {
								display: 'inline-flex',
								maxWidth: '100%',
								lineHeight: '1',
							},
							label: {
								overflow: 'hidden',
								whiteSpace: 'nowrap',
								textOverflow: 'ellipsis',
							},
							control: {
								backgroundColor: 'dim.500',
								_checked: {
									backgroundColor: 'control.action.background',
								},
							},
							thumb: {
								backgroundColor: {
									base: 'control.action.foreground',
									_checked: 'control.action.foreground',
								},
							},
						},
					},
				},
			}),
			tooltip: defineSlotRecipe({
				slots: tooltipAnatomy.keys(),
				base: {
					content: {
						borderRadius: 'sm',
						color: 'typography.inverted',
						// Yeah, that is the official way to set background
						// See the docs: https://chakra-ui.com/docs/components/tooltip#custom-background
						'--tooltip-bg':
							'var(--chakra-colors-surface-inverted-background)',
					},
				},
			}),
			menu: defineSlotRecipe({
				slots: menuAnatomy.keys(),
				base: {
					content: {
						borderColor: 'surface.border',
						backgroundColor: 'surface.background',
					},
					item: {
						color: 'control.ghost.foreground',
						backgroundColor: 'transparent',

						transitionDuration: '0s',
						_highlighted: {
							color: 'control.ghost.hover.foreground',
							backgroundColor: 'control.ghost.hover.background !important',
						},
					},
				},
				variants: {
					size: {
						sm: {
							item: {
								fontSize: 'sm',
								padding: 2,
							},
						},
						md: {
							item: {
								fontSize: 'md',
							},
						},
					},
				},
			}),
			tabs: defineSlotRecipe({
				slots: tabsAnatomy.keys(),
				variants: {
					size: {
						md: {
							trigger: {
								fontSize: 'md',
							},
						},
					},
					variant: {
						subtle: {
							trigger: {
								color: {
									base: 'control.ghost.foreground',
									_hover: 'control.ghost.hover.foreground',
									_selected:
										'control.ghost.active.foreground !important',
								},

								backgroundColor: {
									base: 'transparent',
									_hover: 'control.ghost.hover.background',
									_selected:
										'control.ghost.active.background !important',
								},
							},
						},
					},
				},
				defaultVariants: {
					variant: 'subtle',
				},
			}),

			dialog: defineSlotRecipe({
				slots: dialogAnatomy.keys(),
				base: {
					backdrop: {
						backgroundColor: 'overlay.500',
					},
					content: {
						color: 'typography',
						backgroundColor: 'surface.background',
						fontSize: 'md',
					},
					closeTrigger: {
						_hover: {
							color: 'control.ghost.hover.foreground',
							backgroundColor: 'control.ghost.hover.background',
						},
					},
				},
			}),

			// TODO: debug performance of suggest list
			list: defineSlotRecipe({
				slots: listAnatomy.keys(),
				base: {
					root: {
						borderColor: 'surface.border',
						backgroundColor: 'surface.background',
					},
					item: {
						color: 'control.ghost.foreground',
						backgroundColor: 'transparent',

						_selected: {
							color: 'control.ghost.hover.foreground',
							backgroundColor: 'control.ghost.hover.background',
						},
					},
				},
			}),
			tag: defineSlotRecipe({
				slots: tagAnatomy.keys(),
				variants: {
					variant: {
						base: {
							root: {
								backgroundColor: 'control.background',
								color: 'control.foreground',

								_hover: {
									backgroundColor: 'control.active.background',
								},
							},
						},
						static: {
							root: {
								backgroundColor: 'control.background',
								color: 'control.foreground',
							},
						},
					},
				},
				defaultVariants: {
					variant: 'base',
				},
			}),
			slider: defineSlotRecipe({
				slots: sliderAnatomy.keys(),
				base: {
					markerGroup: {
						mt: '.6rem',
					},
					root: {
						minHeight: '40px',
					},
				},
				variants: {
					size: {
						sm: {
							thumb: {
								boxSize: '.5rem',
							},
						},
						md: {
							thumb: {
								boxSize: '.8rem',
							},
						},
					},
					variant: {
						solid: {
							track: {
								backgroundColor: 'control.background',
								borderRadius: 'lg',
							},
							range: {
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
			progress: defineSlotRecipe({
				slots: progressAnatomy.keys(),
				variants: {
					variant: {
						subtle: {
							track: {
								backgroundColor: 'control.background',
							},
							range: {
								backgroundColor: 'control.foreground',
							},
						},
					},
					status: {
						success: {
							track: {
								backgroundColor: 'control.background',
							},
							range: {
								backgroundColor: 'message.success',
							},
						},
						error: {
							track: {
								backgroundColor: 'control.background',
							},
							range: {
								backgroundColor: 'message.error',
							},
						},
					},
				},
				defaultVariants: {
					variant: 'subtle',
				},
			}),
			alert: defineSlotRecipe({
				slots: alertAnatomy.keys(),
				variants: {
					variant: {
						subtle: {
							indicator: {
								color: 'currentColor',
							},
							root: {
								backgroundColor: 'container.message.background',
								color: 'container.message.foreground',
							},
						},
					},
				},
			}),
			notifications: NotificationsRecipe,
			notePreview: notePreviewRecipe,
			nestedList: NestedListRecipe,
			richEditor: RichEditorRecipe,
		},
	},
});
