import React, { FC } from 'react';
import { Button, HStack, StackProps, Text } from '@chakra-ui/react';
import { useStatusBar } from '@features/MainScreen/StatusBar/StatusBarProvider';

export type StatusBarProps = StackProps;

const isMacOS = navigator.userAgent.includes('Mac OS');

// TODO: make status bar extensible
export const StatusBar: FC<StatusBarProps> = (props) => {
	const { start, end } = useStatusBar();

	return (
		<HStack
			minW="100%"
			fontSize=".9em"
			bgColor="surface.panel"
			borderTop="1px solid"
			borderColor="surface.border"
			paddingInline={isMacOS ? '7px' : undefined}
			{...props}
		>
			<HStack w="auto" gap="0">
				{start.map((item, idx) =>
					item.visible ? (
						<Button
							key={idx}
							ref={item.ref}
							size="xs"
							variant="ghost"
							borderRadius="0"
							fontWeight="normal"
							title={item.title}
							onClick={item.onClick}
						>
							<HStack>
								{item.icon}
								{item.text && <Text>{item.text}</Text>}
							</HStack>
						</Button>
					) : undefined,
				)}
			</HStack>

			<HStack w="auto" gap="0" marginLeft="auto">
				{end.map((item, idx) =>
					item.visible ? (
						<Button
							key={idx}
							ref={item.ref}
							size="xs"
							variant="ghost"
							borderRadius="0"
							fontWeight="normal"
							title={item.title}
							onClick={item.onClick}
						>
							<HStack>
								{item.icon}
								{item.text && <Text>{item.text}</Text>}
							</HStack>
						</Button>
					) : undefined,
				)}
			</HStack>
		</HStack>
	);
};
