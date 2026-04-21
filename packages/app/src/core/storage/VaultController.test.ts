import { webcrypto } from 'node:crypto';

import { createFakeRandomBytesGenerator } from '@core/encryption/__tests__/random';
import { EncryptionController } from '@core/encryption/EncryptionController';
import { ENCRYPTION_ALGORITHM } from '@core/features/encryption';
import { DerivedBitsGenerator } from '@core/features/encryption/worker';
import { CryptographyUtils } from '@core/features/encryption/worker/CryptographyUtils';
import { WorkerEncryptionProcessor } from '@core/features/encryption/worker/WorkerEncryptionProcessor';
import { InMemoryFS } from '@core/features/files/InMemoryFS';
import { DisposableBox } from '@utils/disposable';

import { bytesToHex } from './hex';
import { VaultConfigController } from './VaultConfigController';
import { DisposableEncryption, VaultController } from './VaultController';

vi.stubGlobal('self', {
	crypto: webcrypto,
});

const disposableEncryption: DisposableEncryption = (config) => {
	const workerEncryption = new WorkerEncryptionProcessor(config);
	const encryptionController = new EncryptionController(workerEncryption);

	return new DisposableBox(encryptionController, () => {
		workerEncryption.terminate();
	});
};

const derivedBitsGenerator =
	(cryptoUtils: CryptographyUtils): DerivedBitsGenerator =>
	(input, salt, length, config) => {
		return cryptoUtils.deriveBits(input, salt, length, config);
	};

describe('Vault life cycle', () => {
	const seededRandomBytes = createFakeRandomBytesGenerator(0);
	const cryptoUtils = new CryptographyUtils();
	const getDerivedBytes = derivedBitsGenerator(cryptoUtils);

	const fs = new InMemoryFS();
	const vaultConfig = new VaultConfigController(fs);

	test('Vault can be initialized with user password', async () => {
		const vaultController = new VaultController(
			vaultConfig,
			disposableEncryption,
			getDerivedBytes,
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
			getDerivedBytes,
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
			getDerivedBytes,
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
			getDerivedBytes,
			seededRandomBytes,
		);

		await expect(
			vaultController
				.getMasterKey('wrong password')
				.then((buffer) => bytesToHex(new Uint8Array(buffer))),
		).rejects.toThrow('Integrity violation');
	});
});
