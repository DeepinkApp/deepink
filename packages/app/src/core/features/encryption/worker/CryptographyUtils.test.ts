import { CryptographyUtils } from './CryptographyUtils';

test('Matches a derived bits snapshot', async () => {
	const utils = new CryptographyUtils();
	onTestFinished(() => utils.dispose());

	const key = new Uint8Array(100).fill(0xff);
	expect(key).toEqual(new Uint8Array(100).fill(0xff));

	await expect(
		utils.deriveBits(key, new Uint8Array(16), 128),
	).resolves.toMatchSnapshot();
});

test('Returns 32 bytes for a 256-bit request', async () => {
	const utils = new CryptographyUtils();

	const key = await utils.deriveBits(
		new TextEncoder().encode('password'),
		new Uint8Array(16),
		256,
	);
	expect(key).toHaveLength(32);
});

test('Outputs is equal for equal inputs', async () => {
	const utils = new CryptographyUtils();

	const keys: string[] = [];
	for (let i = 0; i < 10; i++) {
		const key = await utils.deriveBits(
			new TextEncoder().encode('password'),
			new Uint8Array(16),
			256,
			{ memory: 1024 ** 2 * 32, ops: 2 },
		);

		keys.push(Buffer.from(key).toString('hex'));
	}

	expect(keys).toStrictEqual(Array(10).fill(keys[0]));
});

test('Error must be thrown when requested bits length is not equal to a full byte', async () => {
	const utils = new CryptographyUtils();
	await expect(
		utils.deriveBits(new Uint8Array(100), new Uint8Array(16), 191),
	).rejects.toThrow('Length must be a whole number of bits');
});

test('Error must be thrown when requested bits is less than 128', async () => {
	const utils = new CryptographyUtils();
	await expect(
		utils.deriveBits(new Uint8Array(100), new Uint8Array(16), 96),
	).rejects.toThrow('Invalid length. The minimal length is 128 bits');
});

test('Errors must be thrown after dispose', async () => {
	const utils = new CryptographyUtils();

	await utils.dispose();
	await expect(
		utils.deriveBits(new Uint8Array(100), new Uint8Array(16), 32),
	).rejects.toThrow();
});
