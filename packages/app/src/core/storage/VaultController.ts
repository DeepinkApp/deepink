import z from 'zod';
import { IEncryptionProcessor, RandomBytesGenerator } from '@core/encryption';
import { KEY_SALT_BYTES } from '@core/encryption/utils/keys';
import { DerivedBitsGenerator, EncryptionConfig } from '@core/features/encryption/worker';
import { DisposableBox } from '@utils/disposable';

import { bytesToHex, hexToBytes } from './hex';
import { VaultConfigController } from './VaultConfigController';

export const VaultEncryptionConfigScheme = z.object({
	algorithm: z.string(),

	/**
	 * Master key encrypted with a key derived from user password
	 */
	encryptedMasterKey: z.object({
		ciphertext: z.string(),
		salt: z.string(),
	}),

	/**
	 * Params to derive the intermediate encryption key for the master key,
	 * from the user's master password
	 */
	passwordKDF: z.object({
		salt: z.string(),
		params: z.object({
			memory: z.number(),
			ops: z.number(),
		}),
	}),
});

export const VaultPublicConfigScheme = z.object({
	encryption: VaultEncryptionConfigScheme.nullable(),
});

export type VaultPublicConfig = z.output<typeof VaultPublicConfigScheme>;

export type DisposableEncryption = (
	config: EncryptionConfig,
) => DisposableBox<IEncryptionProcessor>;

export class VaultController {
	constructor(
		private readonly config: VaultConfigController,
		private readonly disposableEncryption: DisposableEncryption,
		private readonly deriveBits: DerivedBitsGenerator,
		private readonly getRandomBytes: RandomBytesGenerator,
	) {}

	public async init(config: {
		encryption?: {
			password: string;
			algorithm: string;
			keyDerivation: {
				memory: number;
				ops: number;
			};
		};
	}) {
		const hasConfigFile = await this.config.get().then((config) => config !== null);
		if (hasConfigFile)
			throw new Error(
				'Vault config file is already exist. Cannot override a file implicitly',
			);

		// Init vault with no encryption
		if (!config.encryption) {
			await this.config.set({ encryption: null });
			return;
		}

		// Init encrypted vault
		const {
			password,
			keyDerivation: { memory, ops },
			algorithm,
		} = config.encryption;

		const passwordSalt = this.getRandomBytes(16);
		const argonMemoryInBytes = 1024 ** 2 * memory;
		const derivedPassword = await this.deriveBits(
			new TextEncoder().encode(password),
			passwordSalt,
			256,
			{ memory: argonMemoryInBytes, ops },
		);

		const key = this.getRandomBytes(32);
		const keySalt = this.getRandomBytes(KEY_SALT_BYTES);

		const encryptionWorker = this.disposableEncryption({
			algorithm,
			key: derivedPassword,
			salt: keySalt,
		});

		const encryptedKey = await encryptionWorker
			.getContent()
			.encrypt(key.buffer)
			.finally(() => encryptionWorker.dispose());

		await this.config.set({
			encryption: {
				algorithm,
				encryptedMasterKey: {
					ciphertext: bytesToHex(new Uint8Array(encryptedKey)),
					salt: bytesToHex(new Uint8Array(keySalt)),
				},
				passwordKDF: {
					salt: bytesToHex(new Uint8Array(passwordSalt)),
					params: {
						memory: argonMemoryInBytes,
						ops,
					},
				},
			},
		});
	}

	public async getMasterKey(password: string) {
		const config = await this.config.get();
		if (!config)
			throw new Error(
				'The file with a vault config does not exist. It seems the vault data is corrupted',
			);

		if (!config.encryption) {
			throw new Error('The encryption config is not set for this vault');
		}

		// Init encrypted vault
		const { algorithm, encryptedMasterKey, passwordKDF } = config.encryption;

		const derivedPassword = await this.deriveBits(
			new TextEncoder().encode(password),
			hexToBytes(passwordKDF.salt),
			256,
			{ memory: passwordKDF.params.memory, ops: passwordKDF.params.ops },
		);

		const encryptionWorker = this.disposableEncryption({
			algorithm,
			key: derivedPassword,
			salt: hexToBytes(encryptedMasterKey.salt),
		});

		const masterKey = await encryptionWorker
			.getContent()
			.decrypt(hexToBytes(encryptedMasterKey.ciphertext).buffer)
			.finally(() => encryptionWorker.dispose());

		return masterKey;
	}
}
