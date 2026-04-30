import z, { ZodError } from 'zod';
import { createFakeRandomBytesGenerator } from '@core/encryption/__tests__/random';
import { bytesToHex, hexToBytes } from '@core/storage/hex';
import { createFileControllerMock } from '@utils/mocks/fileControllerMock';
import { wait } from '@utils/time';

import { StateFile } from './StateFile';

const decodeBuffer = (buffer: ArrayBuffer | null) =>
	buffer && new TextDecoder().decode(buffer);

describe('Concurrent writes', () => {
	test('Last config call always wins', async () => {
		const file = createFileControllerMock();
		const originalWrite = file.write;
		const spy = vi.fn(originalWrite);
		file.write = spy;

		spy.mockImplementationOnce(async function (...args) {
			await wait(100);
			return originalWrite(...args);
		});
		spy.mockImplementationOnce(async function (...args) {
			await wait(100);
			return originalWrite(...args);
		});
		spy.mockImplementationOnce(async function (...args) {
			await wait(10);
			return originalWrite(...args);
		});

		const state = new StateFile(file, z.number());
		await expect(
			Promise.all([state.set(1), state.set(2), state.set(3)]),
		).resolves.not.toThrow();

		expect(spy).toBeCalledTimes(2);
		await expect(state.get()).resolves.toBe(3);
		await expect(file.get().then(decodeBuffer)).resolves.toBe('3');
	});

	test('All sequential calls must be handled', async () => {
		const file = createFileControllerMock();
		const originalWrite = file.write;
		const spy = vi.fn(originalWrite);
		file.write = spy;

		spy.mockImplementation(async function (...args) {
			await wait(10);
			return originalWrite(...args);
		});

		const state = new StateFile(file, z.number());

		// Set new value
		await expect(state.set(1)).resolves.not.toThrow();
		expect(spy).toBeCalledTimes(1);
		await expect(state.get()).resolves.toBe(1);
		await expect(file.get().then(decodeBuffer)).resolves.toBe('1');

		// Set new value
		await expect(state.set(2)).resolves.not.toThrow();
		expect(spy).toBeCalledTimes(2);
		await expect(state.get()).resolves.toBe(2);
		await expect(file.get().then(decodeBuffer)).resolves.toBe('2');

		// Set new value
		await expect(state.set(100)).resolves.not.toThrow();
		expect(spy).toBeCalledTimes(3);
		await expect(state.get()).resolves.toBe(100);
		await expect(file.get().then(decodeBuffer)).resolves.toBe('100');
	});
});

describe('Error strategies', () => {
	test('Fail on a file reading errors', async () => {
		const file = createFileControllerMock();
		vi.spyOn(file, 'get').mockImplementation(async function () {
			throw new Error('Test error');
		});

		await expect(new StateFile(file, z.number()).get()).rejects.toThrowError(
			'Test error',
		);
	});

	test('Fail on an invalid data', async () => {
		const file = createFileControllerMock();

		vi.spyOn(file, 'get').mockImplementation(async function () {
			return new Uint8Array(100).buffer;
		});
		await expect(
			new StateFile(file, z.number(), { ignoreParsingErrors: false }).get(),
		).rejects.toThrowError(/^Unexpected token .+? is not valid JSON$/);

		vi.spyOn(file, 'get').mockImplementation(async function () {
			return new TextEncoder().encode('"Not a value you did expect?"').buffer;
		});
		await expect(
			new StateFile(file, z.number(), { ignoreParsingErrors: false }).get(),
		).rejects.toThrow(ZodError);
	});

	test('Use default state on a file reading errors', async () => {
		const file = createFileControllerMock();
		vi.spyOn(file, 'get').mockImplementation(async function () {
			throw new Error('Test error');
		});

		await expect(
			new StateFile(file, z.number(), { ignoreFileReadErrors: true }).get(),
			'Default value null must be returned',
		).resolves.toBe(null);

		await expect(
			new StateFile(file, z.number(), {
				ignoreFileReadErrors: true,
				defaultValue: 42,
			}).get(),
			'Configured default value must be returned',
		).resolves.toBe(42);
	});

	test('Use a default state on an invalid data', async () => {
		const file = createFileControllerMock();
		vi.spyOn(file, 'get').mockImplementation(async function () {
			return new Uint8Array(100).buffer;
		});

		await expect(
			new StateFile(file, z.number()).get(),
			'Default value null must be returned',
		).resolves.toBe(null);

		await expect(
			new StateFile(file, z.number(), { defaultValue: 42 }).get(),
			'Configured default value must be returned',
		).resolves.toBe(42);
	});
});

test('State support the custom Zod codecs', async () => {
	const hexToBytesCodec = z.codec(z.string(), z.instanceof(Uint8Array), {
		encode: (bytes) => bytesToHex(bytes),
		decode: (str) => hexToBytes(str),
	});

	const file = createFileControllerMock();
	const state = new StateFile(
		file,
		z.object({
			buffer: hexToBytesCodec,
		}),
	);

	const getRandomBytes = createFakeRandomBytesGenerator(0);
	const bytes = getRandomBytes(100);
	await state.set({ buffer: bytes });
	await expect(state.get()).resolves.toStrictEqual({ buffer: bytes });

	await expect(
		file
			.get()
			.then((content) => (content ? new TextDecoder().decode(content) : content)),
	).resolves.toMatchSnapshot();
});
