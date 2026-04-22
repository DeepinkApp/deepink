import { webcrypto } from 'node:crypto';

import { noop } from 'lodash';
import { createFakeRandomBytesGenerator } from '@core/encryption/__tests__/random';
import { ENCRYPTION_ALGORITHM } from '@core/features/encryption';
import { InMemoryFS } from '@core/features/files/InMemoryFS';
import { DisposableBox } from '@utils/disposable';

import { disposableEncryption, disposableKDF } from './cryptography';
import { bytesToHex } from './hex';
import { VaultConfigController } from './VaultConfigController';
import { VaultController } from './VaultController';

vi.stubGlobal('self', {
	crypto: webcrypto,
});

describe('Vault life cycle', () => {
	const seededRandomBytes = createFakeRandomBytesGenerator(0);

	const fs = new InMemoryFS();
	const vaultConfig = new VaultConfigController(fs);

	test('Vault can be initialized with user password', async () => {
		const vaultController = new VaultController(
			vaultConfig,
			disposableEncryption,
			disposableKDF,
			seededRandomBytes,
		);

		await expect(
			vaultController.init({
				encryption: {
					password: 'secret password',
					algorithm: ENCRYPTION_ALGORITHM.AES,
					keyDerivation: {
						ops: 2,
						memory: 32,
					},
				},
			}),
		).resolves.toBeUndefined();
	});

	test('Vault cannot be re-initialized if config does exist', async () => {
		const vaultController = new VaultController(
			vaultConfig,
			disposableEncryption,
			disposableKDF,
			seededRandomBytes,
		);

		await expect(
			vaultController.init({
				encryption: {
					password: 'secret password',
					algorithm: ENCRYPTION_ALGORITHM.AES,
					keyDerivation: {
						ops: 2,
						memory: 32,
					},
				},
			}),
		).rejects.toThrow('already exist');
	});

	test('Master key may be decrypted with correct password', async () => {
		const vaultController = new VaultController(
			vaultConfig,
			disposableEncryption,
			disposableKDF,
			seededRandomBytes,
		);

		await expect(
			vaultController
				.getMasterKey('secret password')
				.then((buffer) => bytesToHex(new Uint8Array(buffer))),
		).resolves.toMatchSnapshot();
	});

	test('Master key decryption with incorrect password throws error', async () => {
		const vaultController = new VaultController(
			vaultConfig,
			disposableEncryption,
			disposableKDF,
			seededRandomBytes,
		);

		await expect(
			vaultController
				.getMasterKey('wrong password')
				.then((buffer) => bytesToHex(new Uint8Array(buffer))),
		).rejects.toThrow('Integrity violation');
	});
});

describe('Crypto material must dispose just in time', () => {
	const seededRandomBytes = createFakeRandomBytesGenerator(0);

	test('All disposable containers must be disposed after successful init', async () => {
		const encryptionSpy = vi.fn(
			(...args: Parameters<typeof disposableEncryption>) => {
				const box = disposableEncryption(...args);
				vi.spyOn(box, 'dispose');
				return box;
			},
		);

		const kdfSpy = vi.fn((...args: Parameters<typeof disposableKDF>) => {
			const box = disposableKDF(...args);
			vi.spyOn(box, 'dispose');
			return box;
		});

		const fs = new InMemoryFS();
		const vaultConfig = new VaultConfigController(fs);
		const vaultController = new VaultController(
			vaultConfig,
			encryptionSpy,
			kdfSpy,
			seededRandomBytes,
		);

		await expect(
			vaultController.init({
				encryption: {
					password: 'secret password',
					algorithm: ENCRYPTION_ALGORITHM.AES,
					keyDerivation: {
						ops: 2,
						memory: 32,
					},
				},
			}),
		).resolves.toBeUndefined();

		expect(encryptionSpy).toHaveBeenCalledOnce();
		expect(
			encryptionSpy.mock.results[0].value.dispose,
			'Dispose must be called',
		).toHaveBeenCalledOnce();

		expect(kdfSpy).toHaveBeenCalledOnce();
		expect(
			kdfSpy.mock.results[0].value.dispose,
			'Dispose must be called',
		).toHaveBeenCalledOnce();
	});

	test('Disposable containers must be disposed while errors', async () => {
		const encryptionSpy = vi.fn(
			(...args: Parameters<typeof disposableEncryption>) => {
				const box = disposableEncryption(...args);
				vi.spyOn(box, 'dispose');
				return box;
			},
		);

		const kdfSpy = vi.fn(() => {
			const box = new DisposableBox(async () => {
				throw new Error('test error in KDF');
			}, noop);
			vi.spyOn(box, 'dispose');
			return box;
		});

		const fs = new InMemoryFS();
		const vaultConfig = new VaultConfigController(fs);
		const vaultController = new VaultController(
			vaultConfig,
			encryptionSpy,
			kdfSpy,
			seededRandomBytes,
		);

		await expect(
			vaultController.init({
				encryption: {
					password: 'secret password',
					algorithm: ENCRYPTION_ALGORITHM.AES,
					keyDerivation: {
						ops: 2,
						memory: 32,
					},
				},
			}),
		).rejects.toThrow('test error in KDF');

		expect(kdfSpy).toHaveBeenCalledOnce();
		expect(
			kdfSpy.mock.results[0].value.dispose,
			'Dispose must be called',
		).toHaveBeenCalledOnce();
	});
});

describe('Encryption instance', () => {
	const seededRandomBytes = createFakeRandomBytesGenerator(0);

	test('One instance may decrypt the ciphertext product of another instance', async () => {
		const fs = new InMemoryFS();
		const vaultConfig = new VaultConfigController(fs);
		const vaultController = new VaultController(
			vaultConfig,
			disposableEncryption,
			disposableKDF,
			seededRandomBytes,
		);

		await expect(
			vaultController.init({
				encryption: {
					password: 'secret password',
					algorithm: ENCRYPTION_ALGORITHM.AES,
					keyDerivation: {
						ops: 2,
						memory: 32,
					},
				},
			}),
			'encryption is configured',
		).resolves.toBeUndefined();

		const plaintext = seededRandomBytes(128);

		const encryption1 = await vaultController.getEncryption('secret password');
		onTestFinished(() => encryption1.dispose());

		const ciphertext1 = await encryption1
			.getContent()
			.encrypt(plaintext.buffer.slice());

		const encryption2 = await vaultController.getEncryption('secret password');
		onTestFinished(() => encryption2.dispose());

		await expect(
			encryption2.getContent().decrypt(ciphertext1),
		).resolves.toStrictEqual(plaintext.buffer.slice());
	});
});
