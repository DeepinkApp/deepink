import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
	FaBold,
	FaCalendarDay,
	FaCode,
	FaItalic,
	FaListCheck,
	FaListOl,
	FaListUl,
	FaMinus,
	FaPaperclip,
	FaQuoteLeft,
	FaStrikethrough,
} from 'react-icons/fa6';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Button, HStack } from '@chakra-ui/react';
import { useLocalizedDate } from '@hooks/useLocalizedDate';
import { useAppSelector } from '@state/redux/hooks';
import { selectEditorDateFormat } from '@state/redux/settings/selectors/preferences';

import { HeaderPicker } from './buttons/HeaderPicker';
import { ImageButton } from './buttons/ImageButton';
import { LinkButton } from './buttons/LinkButton';
import { useEditorPanelContext } from '.';

// TODO: add hotkeys to trigger panel commands
// TODO: implement notifications from editor to panel, to render current state for formatting buttons
export const EditorPanel = memo(() => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);
	const localizedDate = useLocalizedDate();

	const { onInserting, onFormatting } = useEditorPanelContext();
	const dateFormat = useAppSelector(selectEditorDateFormat);

	return (
		<HStack
			gap="1rem"
			padding="4px"
			overflow="hidden"
			onMouseDown={(evt) => {
				evt.preventDefault();
				evt.stopPropagation();
			}}
		>
			<HeaderPicker
				buttonProps={{ size: 'xs' }}
				onPick={(level) => {
					onInserting({ type: 'heading', data: { level } });
				}}
			/>

			<HStack gap="0">
				<Button
					size="xs"
					variant="ghost"
					title={t('editorPanel.bold')}
					onClick={() => {
						onFormatting('bold');
					}}
				>
					<FaBold />
				</Button>
				<Button
					size="xs"
					variant="ghost"
					title={t('editorPanel.italic')}
					onClick={() => {
						onFormatting('italic');
					}}
				>
					<FaItalic />
				</Button>
				<Button
					size="xs"
					variant="ghost"
					title={t('editorPanel.strikethrough')}
					onClick={() => {
						onFormatting('strikethrough');
					}}
				>
					<FaStrikethrough />
				</Button>
			</HStack>

			<HStack gap="0">
				<Button
					size="xs"
					variant="ghost"
					title={t('editorPanel.unorderedList')}
					onClick={() => {
						onInserting({ type: 'list', data: { type: 'unordered' } });
					}}
				>
					<FaListUl />
				</Button>
				<Button
					size="xs"
					variant="ghost"
					title={t('editorPanel.checkboxList')}
					onClick={() => {
						onInserting({ type: 'list', data: { type: 'checkbox' } });
					}}
				>
					<FaListCheck />
				</Button>
				<Button
					size="xs"
					variant="ghost"
					title={t('editorPanel.orderedList')}
					onClick={() => {
						onInserting({ type: 'list', data: { type: 'ordered' } });
					}}
				>
					<FaListOl />
				</Button>
			</HStack>

			<HStack gap="0">
				<LinkButton
					size="xs"
					onPick={(payload) =>
						onInserting({
							type: 'link',
							data: payload,
						})
					}
				/>
				<ImageButton
					size="xs"
					onPick={(payload) =>
						onInserting({
							type: 'image',
							data: payload,
						})
					}
				/>
				<Button
					size="xs"
					variant="ghost"
					title={t('editorPanel.codeBlock')}
					onClick={() => {
						onInserting({ type: 'code' });
					}}
				>
					<FaCode />
				</Button>
				<Button
					size="xs"
					variant="ghost"
					title={t('editorPanel.quoteBlock')}
					onClick={() => {
						onInserting({ type: 'quote' });
					}}
				>
					<FaQuoteLeft />
				</Button>
				<Button
					size="xs"
					variant="ghost"
					title={t('editorPanel.insertDate')}
					onClick={() => {
						onInserting({
							type: 'date',
							data: { date: localizedDate(new Date(), dateFormat) },
						});
					}}
				>
					<FaCalendarDay />
				</Button>
				<Button
					size="xs"
					variant="ghost"
					title={t('editorPanel.insertPageBreak')}
					onClick={() => {
						onInserting({ type: 'horizontalRule' });
					}}
				>
					<FaMinus />
				</Button>
				<Button
					size="xs"
					variant="ghost"
					title={t('editorPanel.insertFile')}
					onClick={() => {
						const input = document.createElement('input');
						input.type = 'file';
						input.multiple = true;
						input.addEventListener(
							'change',
							() => {
								const files = input.files;
								input.remove();

								if (files) {
									onInserting({
										type: 'file',
										data: {
											files,
										},
									});
								}
							},
							false,
						);

						input.click();
					}}
				>
					<FaPaperclip />
				</Button>
			</HStack>
		</HStack>
	);
});

EditorPanel.displayName = 'EditorPanel';
