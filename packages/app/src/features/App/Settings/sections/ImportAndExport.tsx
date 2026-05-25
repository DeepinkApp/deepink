import React, { useCallback } from 'react';
import Dropzone from 'react-dropzone';
import { Trans, useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Button, HStack, Menu, Portal, Spinner, Text, VStack } from '@chakra-ui/react';
import { CalmButton } from '@components/CalmButton';
import { useDirectoryPicker } from '@hooks/files/useDirectoryPicker';
import { useFilesPicker } from '@hooks/files/useFilesPicker';
import { ImportTypes, useImportNotesPreset } from '@hooks/notes/useImportNotesPreset';
import { buildFileName, useNotesExport } from '@hooks/notes/useNotesExport';
import { useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/vaults/hooks';
import { selectWorkspace } from '@state/redux/vaults/vaults';

export const ImportAndExport = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.settings);
	const { importFiles, progress: importProgress, abort } = useImportNotesPreset();
	const notesExport = useNotesExport();

	const selectDirectory = useDirectoryPicker();
	const selectFiles = useFilesPicker();

	const onClickImport = useCallback(
		async (type: ImportTypes) => {
			// NotesImporterOptions
			switch (type) {
				case 'zip': {
					const files = await selectFiles({
						accept: '.zip',
					});
					if (!files || files.length !== 1) return;

					await importFiles('zip', Array.from(files));
					break;
				}
				case 'directory': {
					const files = await selectDirectory();
					if (!files || files.length === 0) return;

					await importFiles('directory', Array.from(files));
					break;
				}
			}
		},
		[importFiles, selectDirectory, selectFiles],
	);

	const currentWorkspace = useWorkspaceData();
	const workspaceData = useAppSelector(selectWorkspace(currentWorkspace));

	const importOptions = [
		{ type: 'zip' as const, text: t('migration.import.option.zip') },
		{ type: 'directory' as const, text: t('migration.import.option.directory') },
	];

	return (
		<VStack width="100%" align="start">
			<HStack>
				<Menu.Root size="sm">
					<Menu.Trigger asChild>
						<CalmButton size="sm" disabled={importProgress !== null}>
							{t('migration.import.button')}
						</CalmButton>
					</Menu.Trigger>
					<Portal>
						<Menu.Positioner>
							<Menu.Content>
								{importOptions.map((option) => (
									<Menu.Item
										key={option.type}
										value={option.type}
										onSelect={() => onClickImport(option.type)}
									>
										<Text>{option.text}</Text>
									</Menu.Item>
								))}
							</Menu.Content>
						</Menu.Positioner>
					</Portal>
				</Menu.Root>

				<Button
					size="sm"
					disabled={notesExport.progress !== null}
					onClick={async () => {
						await notesExport.exportNotes(
							buildFileName(workspaceData?.name, 'backup'),
						);
					}}
				>
					{t('migration.export.button')}
				</Button>
			</HStack>
			<Dropzone
				onDrop={async (files) => {
					if (files.length === 0) return;

					// Import zip file
					if (files.length === 1 && files[0].name.endsWith('.zip')) {
						await importFiles('zip', files);
						return;
					}

					// Import markdown files
					await importFiles('directory', files);
				}}
				disabled={importProgress !== null}
			>
				{({ getRootProps, getInputProps, isDragActive }) => (
					<VStack
						{...getRootProps()}
						width="100%"
						gap="1rem"
						as="section"
						border="1px dashed"
						backgroundColor="dim.50"
						borderColor={isDragActive ? 'accent.500' : 'dim.200'}
						borderWidth="2px"
						borderRadius="6px"
						padding="1rem"
						{...(importProgress === null
							? undefined
							: {
									filter: 'contrast(.3)',
									cursor: 'progress',
									userSelect: 'none',
								})}
					>
						<input {...getInputProps()} />
						<Text>{t('migration.import.dropzone.title')}</Text>
						<Text variant="secondary">
							{t('migration.import.dropzone.description')}
						</Text>
					</VStack>
				)}
			</Dropzone>
			{importProgress && (
				<VStack align="center" w="100%" padding="1rem">
					<HStack align="start">
						<Spinner size="sm" />
						<Text>
							<Trans
								t={t}
								i18nKey="migration.import.progress.info"
								values={{
									totalSteps: 3,
									step: { parsing: 1, uploading: 2, updating: 3 }[
										importProgress.stage
									],
								}}
							/>
						</Text>
					</HStack>

					<Text>
						{t(
							{
								parsing: 'migration.import.progress.stage.parsing',
								uploading: 'migration.import.progress.stage.uploading',
								updating: 'migration.import.progress.stage.updating',
							}[importProgress.stage],
							{
								processed: importProgress.processed,
								total: importProgress.total,
							},
						)}
					</Text>

					<Text>
						<Trans
							t={t}
							i18nKey="migration.import.progress.cancel"
							components={{
								cancel: (
									<Button
										variant="plain"
										onClick={() =>
											abort(new Error('User cancel the import'))
										}
									/>
								),
							}}
						/>
					</Text>
				</VStack>
			)}
		</VStack>
	);
};
