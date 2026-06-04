import { createTestStore, mockNoteObject } from '@tests/utils/redux';

import { selectTouchedNoteIds, workspacesApi } from '../vaults';

const { store, workspaceScope, selectors } = createTestStore();

// Init state
beforeEach(() => {
	store.dispatch(
		workspacesApi.closeNotes({
			...workspaceScope,
			query: { all: true },
		}),
	);
	store.dispatch(
		workspacesApi.setOpenedNotesState({
			...workspaceScope,
			notes: [mockNoteObject('1'), mockNoteObject('2'), mockNoteObject('3')],
			activeNoteId: '1',
			previewTabId: null,
		}),
	);
});

test('Active note must be marked as touched', () => {
	expect(selectTouchedNoteIds(selectors.workspace())).toHaveProperty('1', true);

	store.dispatch(
		workspacesApi.setActiveNote({
			...workspaceScope,
			noteId: '2',
		}),
	);
	expect(selectTouchedNoteIds(selectors.workspace())).toHaveProperty('2', true);
});

test('Opened note marked as active must be marked as touched', () => {
	store.dispatch(
		workspacesApi.addOpenedNote({
			...workspaceScope,
			note: mockNoteObject('4'),
			isActive: true,
		}),
	);

	expect(selectTouchedNoteIds(selectors.workspace())).toStrictEqual({
		'1': true,
		'4': true,
	});
});

describe('Closed note must not be considered as touched', () => {
	test('closed via removeOpenedNote', () => {
		store.dispatch(
			workspacesApi.setActiveNote({
				...workspaceScope,
				noteId: '2',
			}),
		);
		expect(selectTouchedNoteIds(selectors.workspace())).toStrictEqual({
			'1': true,
			'2': true,
		});

		store.dispatch(
			workspacesApi.removeOpenedNote({
				...workspaceScope,
				noteId: '2',
			}),
		);
		expect(selectTouchedNoteIds(selectors.workspace())).toStrictEqual({
			'1': true,
		});
	});

	test('closed via closeNotes', () => {
		store.dispatch(
			workspacesApi.setActiveNote({
				...workspaceScope,
				noteId: '2',
			}),
		);
		expect(selectTouchedNoteIds(selectors.workspace())).toStrictEqual({
			'1': true,
			'2': true,
		});

		store.dispatch(
			workspacesApi.closeNotes({
				...workspaceScope,
				query: {
					noteIds: ['2'],
				},
			}),
		);
		expect(selectTouchedNoteIds(selectors.workspace())).toStrictEqual({
			'1': true,
		});
	});
});
