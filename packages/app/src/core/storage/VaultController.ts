import { IEncryptionProcessor, RandomBytesGenerator } from '@core/encryption';
import { DerivedBitsGenerator, EncryptionConfig } from '@core/features/encryption/worker';
import { consumeDisposable, DisposableBox } from '@utils/disposable';

import { VaultConfigController } from './VaultConfigController';

export const KEY_SALT_BYTES = 32;

export type DisposableEncryption = (
	config: EncryptionConfig,
) => DisposableBox<IEncryptionProcessor>;

export type DisposableKDF = () => DisposableBox<DerivedBitsGenerator>;

export const enum VaultOpenErrorCode {
	CORRUPTED_CONFIG = 'CORRUPTED_CONFIG',
	INCORRECT_PASSWORD = 'INCORRECT_PASSWORD',
	CONFIG_DOES_EXIST = 'CONFIG_DOES_EXIST',
}
export class VaultOpenError extends Error {
	constructor(
		public readonly code: VaultOpenErrorCode,
		message: string,
		options?: ErrorOptions,
	) {
		super(message, options);
		this.name = 'VaultOpenError';
	}
}

export class VaultController {
	constructor(
		private readonly config: VaultConfigController,
		private readonly disposableEncryption: DisposableEncryption,
		private readonly disposableKDF: DisposableKDF,
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
			throw new VaultOpenError(
				VaultOpenErrorCode.CONFIG_DOES_EXIST,
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

		const derivedPassword = await consumeDisposable(this.disposableKDF(), (kdf) =>
			kdf(new TextEncoder().encode(password), passwordSalt, 256, {
				memory: argonMemoryInBytes,
				ops,
			}),
		);

		const key = this.getRandomBytes(32);
		const keySalt = this.getRandomBytes(KEY_SALT_BYTES);

		const encryptedKey = await consumeDisposable(
			this.disposableEncryption({
				algorithm,
				key: derivedPassword,
				salt: keySalt,
			}),
			(cipher) => cipher.encrypt(key.buffer),
		);

		await this.config.set({
			encryption: {
				algorithm,
				encryptedMasterKey: new Uint8Array(encryptedKey),
				salt: new Uint8Array(keySalt),
				passwordKDF: {
					salt: new Uint8Array(passwordSalt),
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
		const { algorithm, encryptedMasterKey, salt, passwordKDF } = config.encryption;

		const derivedPassword = await consumeDisposable(
			this.disposableKDF(),
			async (kdf) => {
				try {
					const result = await kdf(
						new TextEncoder().encode(password),
						passwordKDF.salt,
						256,
						{
							memory: passwordKDF.params.memory,
							ops: passwordKDF.params.ops,
						},
					);

					return result;
				} catch (error) {
					throw new VaultOpenError(
						VaultOpenErrorCode.INCORRECT_PASSWORD,
						'Failed to decrypt the key',
						{ cause: error },
					);
				}
			},
		);

		const masterKey = await consumeDisposable(
			this.disposableEncryption({
				algorithm,
				key: derivedPassword,
				salt: salt,
			}),
			async (cipher) => {
				try {
					const result = await cipher.decrypt(encryptedMasterKey.buffer);

					return result;
				} catch (error) {
					throw new VaultOpenError(
						VaultOpenErrorCode.INCORRECT_PASSWORD,
						'Failed to decrypt the key',
						{ cause: error },
					);
				}
			},
		);

		return new Uint8Array(masterKey);
	}

	public async getEncryption(password: string) {
		const config = await this.config.get();
		if (!config)
			throw new Error(
				'The file with a vault config does not exist. It seems the vault data is corrupted',
			);

		if (!config.encryption) {
			throw new Error('The encryption config is not set for this vault');
		}

		// Init encrypted vault
		const { algorithm, salt } = config.encryption;

		const masterKey = await this.getMasterKey(password);

		return this.disposableEncryption({
			algorithm,
			key: masterKey,
			salt: salt,
		});
	}
}
