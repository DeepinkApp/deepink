import { RandomBytesGenerator } from '@core/encryption';
import { consumeDisposable } from '@utils/disposable';

import { DisposableEncryption, DisposableKDF } from './cryptography';
import { VaultEncryptionConfig } from './VaultConfigController';

export const KEY_SALT_BYTES = 32;

export const enum VaultOpenErrorCode {
	NO_ENCRYPTION_CONFIG = 'NO_ENCRYPTION_CONFIG',
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

export class VaultEncryptionController {
	constructor(
		private readonly config: VaultEncryptionConfig,
		private readonly disposableEncryption: DisposableEncryption,
		private readonly disposableKDF: DisposableKDF,
		private readonly getRandomBytes: RandomBytesGenerator,
	) {}

	public async init({
		password,
		keyDerivation: { memory, ops },
		algorithm,
	}: {
		password: string;
		algorithm: string;
		keyDerivation: {
			memory: number;
			ops: number;
		};
	}) {
		const currentConfig = await this.config.get();
		if (currentConfig)
			throw new VaultOpenError(
				VaultOpenErrorCode.CONFIG_DOES_EXIST,
				'Vault config file is already exist. Cannot override a file implicitly',
			);

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
		});
	}

	public async getMasterKey(password: string) {
		const config = await this.getConfig();

		// Init encrypted vault
		const { algorithm, encryptedMasterKey, salt, passwordKDF } = config;

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
		const { algorithm, salt } = await this.getConfig();
		const masterKey = await this.getMasterKey(password);

		return this.disposableEncryption({
			algorithm,
			key: masterKey,
			salt: salt,
		});
	}

	public async getConfig() {
		const config = await this.config.get();
		if (!config)
			throw new VaultOpenError(
				VaultOpenErrorCode.NO_ENCRYPTION_CONFIG,
				'Encryption config is not found. You see this error because vault encryption has not been initialized, or vault data is corrupted',
			);

		return config;
	}
}
