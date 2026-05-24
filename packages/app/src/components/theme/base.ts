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

// TODO: remove all `.base` keys
export default defineConfig({
	globalCss: {
		// "*": {
		// 	focusRingColor: "red.500 !important",
		// },
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

			'select:focus-visible, button:focus-visible, input:focus-visible': {
				boxShadow: 'outline',
			},
		} as SystemStyleObject,
		...getScrollBarStyles(),
	},

	theme: {
		recipes: {
			text: defineRecipe({
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
			link: defineRecipe({
				base: {
					color: 'link.base',
					'&:hover, &:active': {
						color: 'link.hover',
					},
				},
			}),
			button: defineRecipe({
				variants: {
					size: {
						md: {
							fontSize: '1rem',
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
					color: 'typography.base',
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
				},
				variants: {
					size: {
						md: {
							fontSize: '1rem',
						},
						lg: {
							borderWidth: '2px',
						},
					},
					variant: {
						subtle: {
							borderWidth: '1px',
							borderColor: {
								base: 'control.input.border',
								_hover: 'control.input.active.border',
								_focus: 'control.input.border',
								_active: 'control.input.border',
							},

							backgroundColor: {
								base: 'control.input.background',
								_focus: 'transparent',
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
			separator: defineRecipe({
				base: {
					borderColor: 'surface.border',
				},
			}),
		},
		slotRecipes: {
			nativeSelect: defineSlotRecipe({
				slots: nativeSelectAnatomy.keys(),
				base: {
					field: {
						color: 'typography.base',
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
								backgroundColor: 'control.action.foreground',
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
					// TODO: fix background shadow on content
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
			}),
			tabs: defineSlotRecipe({
				slots: tabsAnatomy.keys(),
				variants: {
					variant: {
						subtle: {
							trigger: {
								color: 'control.ghost.foreground',
								backgroundColor: 'transparent',

								_hover: {
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

			dialog: defineSlotRecipe({
				slots: dialogAnatomy.keys(),
				base: {
					backdrop: {
						backgroundColor: 'overlay.500',
					},
					content: {
						color: 'typography.base',
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
