import { Endpoint, expose, transfer } from 'comlink';
import sodium from 'libsodium-wrappers-sumo';

import { CryptographyUtilsWorker } from '.';

expose(
	{
		async deriveBits(input, salt, length, config) {
			try {
				await sodium.ready;

				if (!Number.isInteger(length) || length % 8 !== 0)
					throw new RangeError(
						`Length must be a whole number of bits, got ${length}`,
					);

				if (length < 128)
					throw new RangeError(
						'Invalid length. The minimal length is 128 bits',
					);

				const outputBytes = length / 8;

				if (salt.byteLength !== sodium.crypto_pwhash_argon2id_SALTBYTES)
					throw new Error(
						`Expected salt size is ${sodium.crypto_pwhash_argon2id_SALTBYTES} bytes`,
					);

				// 512mb
				const memory = config?.memory ?? 1024 ** 2 * 512;
				const ops = config?.ops ?? 2;

				const key = sodium.crypto_pwhash(
					outputBytes,
					input,
					salt,
					ops,
					memory,
					sodium.crypto_pwhash_ALG_ARGON2ID13,
				);

				// Ensure returned buffer is a `Uint8Array<ArrayBuffer>`
				const buffer = key.slice();
				return transfer(buffer, [buffer.buffer]);
			} finally {
				sodium.memzero(input);
				sodium.memzero(salt);
			}
		},
	} satisfies CryptographyUtilsWorker,
	self as Endpoint,
);
