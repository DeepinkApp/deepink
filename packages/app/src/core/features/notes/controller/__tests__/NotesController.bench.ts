import { getLongText } from 'src/__tests__/samples';
import { bench } from 'vitest';
import z from 'zod';
import { openSQLite } from '@core/database/sqlite/openSQLite';
import { InMemoryFS } from '@core/features/files/InMemoryFS';
import { StateFile } from '@core/features/files/StateFile';
import { createWorkspaceId } from '@tests/utils/vaultContext';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';

import { FlexSearchIndex } from '../../../../database/flexsearch/FlexSearchIndex';

import { NotesController } from '../NotesController';
import { NotesTextIndexer } from '../NotesTextIndexer';

function getRandomNumber(min: number, max: number) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

const textSample = getLongText();

const benchConfig = {
	iterations: 1,
	time: 0,
	warmupIterations: 0,
	warmupTime: 0,
};

describe('Note ops performance', async () => {
	const dbFile = createFileControllerMock();
	const managedDB = await openSQLite(dbFile);
	afterAll(() => managedDB.close());
	const db = managedDB.get();
	const workspaceId = await createWorkspaceId(db);

	const index = new FlexSearchIndex(new InMemoryFS());
	const notes = new NotesController(db, workspaceId, index);
	const indexScanner = new NotesTextIndexer(
		notes,
		index,
		new StateFile(createFileControllerMock(), z.any()),
	);

	let noteCounter = 0;
	const getNoteId = () => ++noteCounter;

	describe('Note creation', () => {
		bench(
			'Add note with 10k chars text',
			async () => {
				await notes.add({
					title: `Note #${getNoteId()}`,
					text: textSample.slice(0, 10_000),
				});
			},
			{ ...benchConfig, iterations: 100 },
		);

		bench(
			'Add note with 50k chars text',
			async () => {
				await notes.add({
					title: `Note #${getNoteId()}`,
					text: textSample.slice(0, 50_000),
				});
			},
			{ ...benchConfig, iterations: 100 },
		);

		bench(
			'Add note with 90k chars text',
			async () => {
				await notes.add({
					title: `Note #${getNoteId()}`,
					text: textSample.slice(0, 90_000),
				});
			},
			{ ...benchConfig, iterations: 100 },
		);
	});

	describe('Updates', () => {
		let noteIds: string[];
		bench(
			'Update random notes with 300 chars text',
			async function () {
				const randomId = noteIds[getRandomNumber(0, noteIds.length - 1)];

				const updatedData = {
					text: `Updated note #${getNoteId()}`,
					title: textSample.slice(0, 300),
				};
				await notes.update(randomId, updatedData);
			},
			{
				...benchConfig,
				iterations: 100,
				async setup(_task, mode) {
					if (mode !== 'warmup') return;
					noteIds = await notes
						.get()
						.then((notes) => notes.map(({ id }) => id));
				},
			},
		);

		bench(
			'Update random notes with 10_000 chars text',
			async function () {
				const randomId = noteIds[getRandomNumber(0, noteIds.length - 1)];

				const updatedData = {
					text: `Updated note #${getNoteId()}`,
					title: textSample.slice(0, 10_000),
				};
				await notes.update(randomId, updatedData);
			},
			{
				...benchConfig,
				iterations: 100,
				async setup(_task, mode) {
					if (mode !== 'warmup') return;
					noteIds = await notes
						.get()
						.then((notes) => notes.map(({ id }) => id));
				},
			},
		);

		bench(
			'Update random notes with 80_000 chars text',
			async function () {
				const randomId = noteIds[getRandomNumber(0, noteIds.length - 1)];

				const updatedData = {
					text: `Updated note #${getNoteId()}`,
					title: textSample.slice(0, 80_000),
				};
				await notes.update(randomId, updatedData);
			},
			{
				...benchConfig,
				iterations: 100,
				async setup(_task, mode) {
					if (mode !== 'warmup') return;
					noteIds = await notes
						.get()
						.then((notes) => notes.map(({ id }) => id));
				},
			},
		);
	});

	describe('Note search', () => {
		bench(
			'Search note with random text',
			async function () {
				await indexScanner.update();
				await notes.get({
					// Text with typo
					search: { text: `powr` },
					limit: 10,
				});
			},
			{
				...benchConfig,
				iterations: 10,
			},
		);
	});
});
