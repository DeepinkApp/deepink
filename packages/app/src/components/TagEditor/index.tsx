import React, { FC, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Button, Dialog, Field, HStack, Input, Text, VStack } from '@chakra-ui/react';
import { IResolvedTag } from '@core/features/tags';

import { SuggestedTagsList } from '../SuggestedTagsList';

export type TagEditorData = {
	id?: string;
	name: string;
	parent: string | null;
};

export type ITagEditorProps = {
	/**
	 * Available tags
	 */
	tags: IResolvedTag[];
	parentTag?: IResolvedTag;
	/**
	 * Saves the tag, returns a Promise with { ok: true } on success or { ok: false; error: string } for known errors
	 * or throws for unexpected errors
	 */
	onSave: (
		tagData: TagEditorData,
	) => Promise<{ ok: true } | { ok: false; error: string }>;
	onCancel: () => void;
	editedTag?: TagEditorData;
};

export const TagEditor: FC<ITagEditorProps> = ({
	tags,
	parentTag,
	editedTag,
	onSave,
	onCancel,
}) => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);
	const { t: tCommon } = useTranslation(LOCALE_NAMESPACE.common);

	const isEditingMode = editedTag !== undefined;

	const [parentTagId, setParentTagId] = useState<string | null>(
		parentTag ? parentTag.id : null,
	);
	const [selectedParentTag, setSelectedParentTag] = useState<IResolvedTag | null>(
		parentTag ? parentTag : null,
	);

	const [tagName, setTagName] = useState(editedTag ? editedTag.name : '');
	const [tagNameError, setTagNameError] = useState<string | null>(null);
	const [isTagsListVisible, setIsTagsListVisible] = useState(false);

	// Reset errors
	useEffect(() => {
		setTagNameError(null);
	}, [tagName, parentTagId, isEditingMode]);

	const tagNameRef = useRef<HTMLInputElement>(null);
	const hasNameError = tagNameError !== null;
	useEffect(() => {
		if (!hasNameError) return;

		tagNameRef.current?.focus();
	}, [hasNameError]);

	// Reset parent tag
	useEffect(() => {
		if (!parentTag) return;

		setParentTagId(parentTag.id);
		setSelectedParentTag(parentTag);
	}, [parentTag]);

	// Remove parent tag
	useEffect(() => {
		if (!selectedParentTag) {
			setParentTagId(null);
		}
	}, [selectedParentTag]);

	// Reset parent tag name
	useEffect(() => {
		if (isTagsListVisible) return;

		const parentTag = tags.find(({ id }) => id === parentTagId);
		setSelectedParentTag(parentTag ? parentTag : null);
	}, [isTagsListVisible, parentTagId, tags]);

	// Set parent tag name
	useEffect(() => {
		const parentTag = tags.find(({ id }) => id === parentTagId);
		setSelectedParentTag(parentTag ? parentTag : null);
	}, [parentTagId, tags]);

	const [isPending, setIsPending] = useState(false);
	return (
		<form
			onSubmit={async (event) => {
				event.preventDefault();
				if (isPending) return;

				setIsPending(true);
				try {
					const name = tagName.trim();

					const result = await onSave({
						name,
						parent: parentTagId,
						...(isEditingMode && editedTag.id ? { id: editedTag.id } : {}),
					});

					if (!result.ok) {
						setTagNameError(result.error);
						return;
					}
					onCancel();
				} catch (error) {
					console.error(error);

					setTagNameError(t('tag.editor.messages.unknownSubmitError'));
				} finally {
					setIsPending(false);
				}
			}}
		>
			<Dialog.CloseTrigger />
			<Dialog.Header>
				{isEditingMode
					? t('tag.editor.mode.edit.title')
					: t('tag.editor.mode.add.title')}
			</Dialog.Header>
			<Dialog.Body>
				<VStack align="start" gap="1rem">
					<VStack w="100%" align="start" gap="0.5rem">
						<Text>{t('tag.editor.field.parent.label')}</Text>
						<SuggestedTagsList
							placeholder={t('tag.editor.field.parent.placeholder')}
							tags={tags}
							selectedTag={selectedParentTag ?? undefined}
							onPick={(tag) => {
								setParentTagId(tag.id);
								setIsTagsListVisible(false);
							}}
						/>
					</VStack>

					<Field.Root invalid={tagNameError !== null}>
						<VStack w="100%" align="start" gap="0.5rem">
							<Text>{t('tag.editor.field.name.label')}</Text>
							<Input
								ref={tagNameRef}
								placeholder={t('tag.editor.field.name.placeholder')}
								value={tagName}
								onChange={(evt) => {
									setTagName(evt.target.value);
								}}
								autoFocus={true}
							/>

							{tagNameError && (
								<Field.ErrorText>{tagNameError}</Field.ErrorText>
							)}
						</VStack>
					</Field.Root>
				</VStack>
			</Dialog.Body>
			<Dialog.Footer>
				<HStack w="100%" justifyContent="end">
					<Button type="submit" variant={'accent' as any} disabled={isPending}>
						{isEditingMode
							? t('tag.editor.mode.edit.action')
							: t('tag.editor.mode.add.action')}
					</Button>
					<Button onClick={onCancel}>{tCommon('actions.cancel')}</Button>
				</HStack>
			</Dialog.Footer>
		</form>
	);
};
