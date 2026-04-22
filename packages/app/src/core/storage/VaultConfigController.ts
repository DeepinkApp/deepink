import z from 'zod';
import { IFilesStorage } from '@core/features/files';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';

import { bytesToHex, hexToBytes } from './hex';

const hexToBytesCodec = z.codec(z.string(), z.instanceof(Uint8Array), {
	encode: (bytes) => bytesToHex(bytes),
	decode: (str) => hexToBytes(str),
});

export const VaultEncryptionConfigScheme = z.object({
	/**
	 * The algorithm name or dash-separated algorithms list
	 */
	algorithm: z.string(),

	/**
	 * Master key encrypted with a key derived from user password
	 */
	encryptedMasterKey: hexToBytesCodec,

	/**
	 * Salt used to derive the independent keys for cascade ciphers
	 */
	salt: hexToBytesCodec,

	/**
	 * Params to derive the intermediate encryption key for the master key,
	 * from the user's master password
	 */
	passwordKDF: z.object({
		salt: hexToBytesCodec,
		params: z.object({
			memory: z.number(),
			ops: z.number(),
		}),
	}),
});

export class VaultEncryptionConfig extends StateFile<
	typeof VaultEncryptionConfigScheme,
	void
> {
	constructor(files: IFilesStorage) {
		const configFile = '/encryption.json';
		super(new FileController(configFile, files), VaultEncryptionConfigScheme);
	}
}
