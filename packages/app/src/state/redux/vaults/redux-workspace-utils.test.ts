import { INote } from '@core/features/notes';

import { findNearNote } from './utils';

const mockNoteObject = (id: string) => ({ id }) as unknown as INote;
const mockNoteIds = (ids: string[]) => ids.map((id) => mockNoteObject(id));

describe('findNearNote util', () => {
	test('Must return previous note by default', () => {
		expect(findNearNote(mockNoteIds(['1', '2', '3', '4', '5']), '3')).toEqual(
			mockNoteObject('2'),
		);
	});

	test('Must return previous note for the last id', () => {
		expect(findNearNote(mockNoteIds(['1', '2', '3', '4', '5']), '5')).toEqual(
			mockNoteObject('4'),
		);
	});

	test('Must return next note for the first id', () => {
		expect(findNearNote(mockNoteIds(['1', '2', '3', '4', '5']), '1')).toEqual(
			mockNoteObject('2'),
		);
	});

	test('Must return last note for not found id', () => {
		expect(findNearNote(mockNoteIds(['1', '2', '3', '4', '5']), '111')).toEqual(
			mockNoteObject('5'),
		);
	});

	test('Must return null if nothing found', () => {
		expect(findNearNote(mockNoteIds(['1']), '1')).toBeNull();
	});
});
