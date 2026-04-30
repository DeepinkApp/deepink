import { IEncryptionProcessor } from '@core/encryption';
import { EncryptionController } from '@core/encryption/EncryptionController';
import { DerivedBitsGenerator, EncryptionConfig } from '@core/features/encryption/worker';
import { CryptographyUtils } from '@core/features/encryption/worker/CryptographyUtils';
import { WorkerEncryptionProcessor } from '@core/features/encryption/worker/WorkerEncryptionProcessor';
import { DisposableBox } from '@utils/disposable';

export type DisposableEncryption = (
	config: EncryptionConfig,
) => DisposableBox<IEncryptionProcessor>;

export const disposableEncryption: DisposableEncryption = (config) => {
	const workerEncryption = new WorkerEncryptionProcessor(config);
	const encryptionController = new EncryptionController(workerEncryption);

	return new DisposableBox(encryptionController, async () => {
		await workerEncryption.terminate();
	});
};

export type DisposableKDF = () => DisposableBox<DerivedBitsGenerator>;

export const disposableKDF = (): DisposableBox<DerivedBitsGenerator> => {
	const cryptoUtils = new CryptographyUtils();
	return new DisposableBox(cryptoUtils.deriveBits.bind(cryptoUtils), async () => {
		await cryptoUtils.dispose();
	});
};
