import React, { useCallback, useRef } from 'react';
import FocusLock, { MoveFocusInside } from 'react-focus-lock';
import { FaCheck, FaLinkSlash } from 'react-icons/fa6';
import { Card, Group, Input } from '@chakra-ui/react';
import { IconButton } from '@components/IconButton';

export const LinkEditor = ({
	url,
	onChange,
	onUnlink,
	onClose,
}: {
	url: string;
	onChange: (url: string) => void;
	onUnlink: () => void;
	onClose: () => void;
}) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const updateUrl = useCallback(() => {
		const value = inputRef.current?.value;
		if (value !== undefined) {
			onChange(value);
		}
		onClose();
	}, [onChange, onClose]);
	return (
		<FocusLock>
			<Card.Root
				css={{
					backgroundColor: 'surface.background',
				}}
				boxShadow="outline"
				borderRadius="12px"
			>
				<Card.Body padding=".5rem">
					<MoveFocusInside>
						<form
							aria-label="Link props editor"
							onSubmit={(event) => {
								event.preventDefault();
								updateUrl();
							}}
						>
							<Group>
								<Input
									ref={inputRef}
									placeholder="Link URL"
									defaultValue={url}
									size="sm"
								/>
								<IconButton
									type="submit"
									size="sm"
									variant="accent"
									icon={<FaCheck />}
									title="Update URL"
									onClick={updateUrl}
								/>
								<IconButton
									size="sm"
									variant="subtle"
									icon={<FaLinkSlash />}
									title="Convert link to text"
									onClick={() => {
										onUnlink();
										onClose();
									}}
								/>
							</Group>
						</form>
					</MoveFocusInside>
				</Card.Body>
			</Card.Root>
		</FocusLock>
	);
};
