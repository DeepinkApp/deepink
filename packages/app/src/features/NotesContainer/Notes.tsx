import React, { FC } from 'react';
import { isEqual } from 'lodash';
import { Box } from '@chakra-ui/react';
import { INote, INoteContent, NoteId } from '@core/features/notes';
import { NoteMeta } from '@core/features/notes/controller';

import { useEditorLinks } from '../MonakoEditor/features/useEditorLinks';
import { Note } from '../NoteEditor';

export type NotesProps = {
	tabs: NoteId[];
	activeTab: NoteId | null;

	notes: INote[];
	updateNote: (note: INote) => Promise<void>;
};

export const Notes: FC<NotesProps> = ({ notes, tabs, activeTab, updateNote }) => {
	useEditorLinks();

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				flexGrow: '100',
				width: '100%',
			}}
		>
			{tabs
				.filter((id) => notes.some((note) => note.id === id))
				.map((id) => {
					const note = notes.find((note) => note.id === id)!;
					const isActive = activeTab === note.id;

					return (
						<Box
							key={note.id}
							display={isActive ? 'flex' : 'none'}
							w="100%"
							h="100%"
						>
							<Note
								key={note.id}
								note={note}
								updateNote={(content: INoteContent) => {
									// Skip updates with not changed data
									if (isEqual(note.content, content)) {
										return;
									}

									updateNote({ ...note, content });
								}}
								updateMeta={(meta: Partial<NoteMeta>) => {
									updateNote({ ...note, ...meta });
								}}
								isActive={isActive}
							/>
						</Box>
					);
				})}
		</Box>
	);
};
