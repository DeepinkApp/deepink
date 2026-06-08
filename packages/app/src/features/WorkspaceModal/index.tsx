import React from 'react';
import { Dialog, Portal } from '@chakra-ui/react';
import { useIsActiveWorkspace } from '@hooks/useIsActiveWorkspace';

/**
 * Modal window bound to a workspace context
 *
 * Window automatically will be hidden if workspace will be inactive,
 * and become visible back when workspace will be active again.
 */
export const WorkspaceModal = (props: Dialog.RootProps) => {
	const isActiveWorkspace = useIsActiveWorkspace();

	return (
		<Dialog.Root {...props} open={isActiveWorkspace && (props.open ?? false)}>
			<Portal>{props.children}</Portal>
		</Dialog.Root>
	);
};
