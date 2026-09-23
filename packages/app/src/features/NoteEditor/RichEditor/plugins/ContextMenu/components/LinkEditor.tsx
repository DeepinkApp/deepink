import React, { useCallback, useRef } from 'react';
import FocusLock, { MoveFocusInside } from 'react-focus-lock';
import { useTranslation } from 'react-i18next';
import { FaCheck, FaLinkSlash } from 'react-icons/fa6';
import { LOCALE_NAMESPACE } from 'src/i18n';
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
	const { t } = useTranslation(LOCALE_NAMESPACE.features);

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
							aria-label={t('contextMenu.linkProperties.title')}
							onSubmit={(event) => {
								event.preventDefault();
								updateUrl();
							}}
						>
							<Group>
								<Input
									ref={inputRef}
									placeholder={t('contextMenu.linkProperties.urlLabel')}
									defaultValue={url}
									size="sm"
								/>
								<IconButton
									type="submit"
									size="sm"
									variant="accent"
									icon={<FaCheck />}
									title={t('contextMenu.linkProperties.actions.update')}
									onClick={updateUrl}
								/>
								<IconButton
									size="sm"
									variant="subtle"
									icon={<FaLinkSlash />}
									title={t('contextMenu.linkProperties.actions.remove')}
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
