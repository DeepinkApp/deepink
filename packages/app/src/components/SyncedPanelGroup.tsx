import React, { useEffect, useRef } from 'react';
import {
	disableGlobalCursorStyles,
	ImperativePanelGroupHandle,
	PanelGroup,
	PanelGroupProps,
	PanelResizeHandle,
} from 'react-resizable-panels';
import { isEqual } from 'lodash';
import { GlobalEvents } from '@api/events/global';
import { Box } from '@chakra-ui/react';
import { useEventBus } from '@hooks/events/useEventBus';

disableGlobalCursorStyles();

/**
 * The same as `PanelGroup`, but automatically sync panels size across workspaces.
 *
 * When `autoSaveId` is provided and panel size change occurs, this component
 * emit event that will be handled by instances in other workspaces,
 * and panels size there will be automatically updated.
 *
 * @link https://www.npmjs.com/package/react-resizable-panels
 */
export const SyncedPanelGroup = (props: PanelGroupProps) => {
	const events = useEventBus();

	const { autoSaveId: syncId } = props;

	const panelRef = useRef<ImperativePanelGroupHandle | null>(null);
	useEffect(() => {
		if (!syncId) return;

		return events.listen(GlobalEvents.PANEL_RESIZE, (event) => {
			// Sync only panels with the same id
			if (syncId !== event.panelId) return;

			const panel = panelRef.current;
			if (!panel) return;

			const currentLayout = panel.getLayout();
			const newLayout = event.layout;

			// Skip if layout is different
			if (currentLayout.length !== newLayout.length) return;

			// Skip if no changes
			if (isEqual(currentLayout, newLayout)) return;

			panel.setLayout(event.layout);
		});
	}, [events, syncId]);

	return (
		<PanelGroup
			{...props}
			ref={panelRef}
			onLayout={(layout) => {
				if (syncId) {
					events.emit(GlobalEvents.PANEL_RESIZE, {
						panelId: syncId,
						layout,
					});
				}
			}}
		/>
	);
};

export const StyledPanelResizeHandle = () => {
	return (
		<Box asChild color="surface.border">
			<PanelResizeHandle />
		</Box>
	);
};
