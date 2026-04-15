import React, { createContext, FC, PropsWithChildren, useState } from 'react';
import { createEvent } from 'effector';
import { EventBus } from '@api/events/EventBus';
import { WorkspaceEventsPayloadMap } from '@api/events/workspace';
import { AttachmentsController } from '@core/features/attachments/AttachmentsController';
import { IFilesStorage } from '@core/features/files';
import { FilesController } from '@core/features/files/FilesController';
import { INote } from '@core/features/notes';
import { INotesController } from '@core/features/notes/controller';
import { NoteVersions } from '@core/features/notes/history/NoteVersions';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

import { WorkspaceContainer } from './useWorkspace';

export type NotesApi = {
	openNote: (note: INote, options?: { focus?: boolean; isTemporary?: boolean }) => void;
	noteUpdated: (note: INote) => void;
	noteClosed: (noteId: string) => void;
};
export const NotesContext = createContext<NotesApi | null>(null);
export const useNotesContext = createContextGetterHook(NotesContext);

export const EventBusContext = createContext<EventBus<WorkspaceEventsPayloadMap> | null>(
	null,
);
export const useEventBus = createContextGetterHook(EventBusContext);

export const NotesRegistryContext = createContext<INotesController | null>(null);
export const useNotesRegistry = createContextGetterHook(NotesRegistryContext);

export const NotesHistoryContext = createContext<NoteVersions | null>(null);
export const useNotesHistory = createContextGetterHook(NotesHistoryContext);

export const TagsRegistryContext = createContext<TagsController | null>(null);
export const useTagsRegistry = createContextGetterHook(TagsRegistryContext);

export const AttachmentsControllerContext = createContext<AttachmentsController | null>(
	null,
);
export const useAttachmentsController = createContextGetterHook(
	AttachmentsControllerContext,
);

export const FilesRegistryContext = createContext<FilesController | null>(null);
export const useFilesRegistry = createContextGetterHook(FilesRegistryContext);

export const FilesControllerContext = createContext<IFilesStorage | null>(null);
export const useFilesController = createContextGetterHook(FilesControllerContext);

export const WorkspaceContainerContext = createContext<WorkspaceContainer | null>(null);
export const useWorkspaceContainer = createContextGetterHook(WorkspaceContainerContext);

export interface WorkspaceProviderProps extends PropsWithChildren, WorkspaceContainer {
	notesApi: NotesApi;
}

export const WorkspaceProvider: FC<WorkspaceProviderProps> = ({
	children,
	notesApi,
	...workspaceContainer
}) => {
	const {
		filesRegistry,
		filesController,
		attachmentsController,
		tagsRegistry,
		notesRegistry,
		notesHistory,
	} = workspaceContainer;

	const [eventBus] = useState(() => {
		const event = createEvent<{
			name: string;
			payload: any;
		}>();
		return {
			emit(eventName: string, payload?: any) {
				event({ name: eventName, payload });
			},
			listen(eventName, callback) {
				return event.watch((event) => {
					if (event.name !== eventName) return;

					callback(event.payload);
				});
			},
		} satisfies EventBus<WorkspaceEventsPayloadMap>;
	});

	return (
		<WorkspaceContainerContext value={workspaceContainer}>
			<EventBusContext.Provider value={eventBus}>
				<NotesContext.Provider value={notesApi}>
					<FilesRegistryContext.Provider value={filesRegistry}>
						<FilesControllerContext.Provider value={filesController}>
							<AttachmentsControllerContext.Provider
								value={attachmentsController}
							>
								<TagsRegistryContext.Provider value={tagsRegistry}>
									<NotesRegistryContext.Provider value={notesRegistry}>
										<NotesHistoryContext.Provider
											value={notesHistory}
										>
											{children}
										</NotesHistoryContext.Provider>
									</NotesRegistryContext.Provider>
								</TagsRegistryContext.Provider>
							</AttachmentsControllerContext.Provider>
						</FilesControllerContext.Provider>
					</FilesRegistryContext.Provider>
				</NotesContext.Provider>
			</EventBusContext.Provider>
		</WorkspaceContainerContext>
	);
};
