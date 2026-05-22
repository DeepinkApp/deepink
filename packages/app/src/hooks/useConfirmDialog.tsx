import React, { ReactNode, useCallback } from 'react';
import { AutoFocusInside } from 'react-focus-lock';
import { Box, Dialog, HStack, VStack } from '@chakra-ui/react';
import { useWorkspaceModal } from '@features/WorkspaceModal/useWorkspaceModal';

export const useConfirmDialog = () => {
	const { show } = useWorkspaceModal();

	return useCallback(
		(
			getContent: (props: { onClose: () => void }) => {
				title: ReactNode;
				content: ReactNode;
				action?: ReactNode;
			},
		) => {
			show({
				content: ({ onClose }) => {
					const { title, content, action } = getContent({ onClose });
					return (
						<>
							<Dialog.CloseTrigger />
							<Dialog.Header>
								<Box>{title}</Box>
							</Dialog.Header>
							<Dialog.Body paddingBottom="1rem">
								<VStack w="100%" gap="1rem" align="start">
									<Box>{content}</Box>

									{action && (
										<HStack justifyContent="end" w="100%" asChild>
											<AutoFocusInside>{action}</AutoFocusInside>
										</HStack>
									)}
								</VStack>
							</Dialog.Body>
						</>
					);
				},
			});
		},
		[show],
	);
};
