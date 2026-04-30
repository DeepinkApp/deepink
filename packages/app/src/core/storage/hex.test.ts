import { createFakeRandomBytesGenerator } from '@core/encryption/__tests__/random';

import { bytesToHex, hexToBytes } from './hex';

test('Hex string overhead is x2', () => {
	const seededRandomBytes = createFakeRandomBytesGenerator(0);

	const bytes = seededRandomBytes(500);
	expect(bytesToHex(bytes)).toHaveLength(1000);
});

test('Hex string may be parsed back to bytes', () => {
	const seededRandomBytes = createFakeRandomBytesGenerator(0);

	const bytes = seededRandomBytes(500);
	const hex = bytesToHex(bytes);
	expect(hexToBytes(hex)).toStrictEqual(bytes);
});
