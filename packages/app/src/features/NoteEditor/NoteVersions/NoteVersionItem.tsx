import React, { forwardRef, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCheck, FaGlasses, FaTrashCan } from 'react-icons/fa6';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Button, HStack, StackProps, Text } from '@chakra-ui/react';
import { NoteVersion } from '@core/features/notes/history/NoteVersions';

export const NoteVersionItem = memo(
	forwardRef<
		HTMLDivElement,
		StackProps & {
			version: NoteVersion;
			isReadOnly?: boolean;
			onDelete: () => void;
			onApply: () => void;
			onPreview: () => void;
		}
	>(({ version, isReadOnly, onPreview, onApply, onDelete, ...props }, ref) => {
		const { t } = useTranslation(LOCALE_NAMESPACE.features);

		return (
			<HStack
				ref={ref}
				w="100%"
				align="start"
				padding="0.3rem"
				alignItems="center"
				_hover={{ backgroundColor: 'dim.50' }}
				{...props}
			>
				<HStack>
					<Text>{new Date(version.createdAt).toLocaleString()}</Text>
					<Text variant="secondary">
						{t('note.version.chars', {
							count: version.text.length,
						})}
					</Text>
				</HStack>
				<HStack marginLeft="auto">
					<Button
						disabled={Boolean(isReadOnly)}
						size="xs"
						title={
							isReadOnly
								? t('note.version.apply.readonlyTitle')
								: t('note.version.apply.title')
						}
						onClick={onApply}
					>
						<FaCheck />
					</Button>

					<Button
						size="xs"
						title={t('note.version.open.title')}
						onClick={onPreview}
					>
						<FaGlasses />
					</Button>
					<Button
						size="xs"
						title={t('note.version.delete.title')}
						onClick={onDelete}
					>
						<FaTrashCan />
					</Button>
				</HStack>
			</HStack>
		);
	}),
);

NoteVersionItem.displayName = 'NoteVersionItem';
