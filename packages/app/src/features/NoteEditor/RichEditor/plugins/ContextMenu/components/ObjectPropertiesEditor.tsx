import * as React from 'react';
import FocusLock, { AutoFocusInside } from 'react-focus-lock';
import { FaXmark } from 'react-icons/fa6';
import { Button, Card, HStack, Text } from '@chakra-ui/react';
import {
	OptionObject,
	PropertiesForm,
	PropertiesFormProps,
} from '@components/PropertiesForm';

export type ObjectPropertiesEditor<T extends OptionObject[]> = Omit<
	PropertiesFormProps<T>,
	'onCancel'
> & {
	title: string;
	onClose?: () => void;
};

export const ObjectPropertiesEditor = <T extends OptionObject[]>({
	title,
	onClose,
	...rest
}: ObjectPropertiesEditor<T>) => {
	return (
		<FocusLock>
			<Card.Root
				css={{
					backgroundColor: 'surface.background',
				}}
				boxShadow="outline"
			>
				<Card.Header
					display="flex"
					flexDirection="row"
					padding="1rem"
					justifyContent="space-between"
					alignItems="baseline"
					fontWeight="bold"
				>
					<Text>{title}</Text>
					{onClose && (
						<HStack marginLeft="1rem">
							<Button size="sm" onClick={onClose}>
								<FaXmark />
							</Button>
						</HStack>
					)}
				</Card.Header>
				<Card.Body padding="1rem">
					<AutoFocusInside>
						<PropertiesForm {...rest} onCancel={onClose} />
					</AutoFocusInside>
				</Card.Body>
			</Card.Root>
		</FocusLock>
	);
};
