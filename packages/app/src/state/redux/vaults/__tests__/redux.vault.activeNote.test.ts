import { createTestStore, mockNoteObject } from '@tests/utils/redux';

import { selectActiveNoteId, workspacesApi } from '../vaults';

describe('Active note consistency', () => {
	const { store, workspaceScope, selectors } = createTestStore();

	// Init state
	beforeAll(() => {
		store.dispatch(
			workspacesApi.setOpenedNotes({
				...workspaceScope,
				notes: [mockNoteObject('1'), mockNoteObject('2'), mockNoteObject('3')],
			}),
		);
	});

	test('Any opened note can be set as an active note', () => {
		store.dispatch(
			workspacesApi.setActiveNote({
				...workspaceScope,
				noteId: '1',
			}),
		);
		expect(selectActiveNoteId(selectors.workspace())).toStrictEqual('1');

		store.dispatch(
			workspacesApi.setActiveNote({
				...workspaceScope,
				noteId: '2',
			}),
		);
		expect(selectActiveNoteId(selectors.workspace())).toStrictEqual('2');
	});

	test('Note id out of opened notes list must be ignored, active note must not be changed', () => {
		store.dispatch(
			workspacesApi.setActiveNote({
				...workspaceScope,
				noteId: '1',
			}),
		);
		expect(selectActiveNoteId(selectors.workspace())).toStrictEqual('1');

		// Invalid note cannot be selected
		store.dispatch(
			workspacesApi.setActiveNote({
				...workspaceScope,
				noteId: '999',
			}),
		);
		expect(selectActiveNoteId(selectors.workspace())).toStrictEqual('1');
	});
});

describe('Active note management', () => {
	test('Active note must be changed when current note is closed', () => {
		const { store, workspaceScope, selectors } = createTestStore();
		store.dispatch(
			workspacesApi.setOpenedNotes({
				...workspaceScope,
				notes: [
					mockNoteObject('1'),
					mockNoteObject('2'),
					mockNoteObject('3'),
					mockNoteObject('4'),
					mockNoteObject('5'),
				],
			}),
		);

		store.dispatch(
			workspacesApi.setActiveNote({
				...workspaceScope,
				noteId: '3',
			}),
		);
		expect(selectActiveNoteId(selectors.workspace())).toStrictEqual('3');

		store.dispatch(
			workspacesApi.removeOpenedNote({
				...workspaceScope,
				noteId: '3',
			}),
		);
		expect(selectActiveNoteId(selectors.workspace())).toStrictEqual('2');

		store.dispatch(
			workspacesApi.removeOpenedNote({
				...workspaceScope,
				noteId: '2',
			}),
		);
		expect(selectActiveNoteId(selectors.workspace())).toStrictEqual('1');

		store.dispatch(
			workspacesApi.removeOpenedNote({
				...workspaceScope,
				noteId: '1',
			}),
		);
		expect(selectActiveNoteId(selectors.workspace())).toStrictEqual('4');

		store.dispatch(
			workspacesApi.removeOpenedNote({
				...workspaceScope,
				noteId: '4',
			}),
		);
		expect(selectActiveNoteId(selectors.workspace())).toStrictEqual('5');

		store.dispatch(
			workspacesApi.removeOpenedNote({
				...workspaceScope,
				noteId: '5',
			}),
		);
		expect(selectActiveNoteId(selectors.workspace())).toStrictEqual(null);
	});
});
