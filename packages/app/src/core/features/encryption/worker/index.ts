import { IEncryptionController } from '@core/encryption';

export type EncryptionConfig = {
	algorithm: string;
	key: Uint8Array<ArrayBuffer>;
	salt: Uint8Array<ArrayBuffer>;
};

export type EncryptionWorkerConfig = EncryptionConfig & { disablePulse?: boolean };
export interface EncryptionWorker extends IEncryptionController {
	init(config: EncryptionWorkerConfig): Promise<void>;
}

export type DerivedBitsGenerator = (
	input: Uint8Array<ArrayBuffer>,
	salt: Uint8Array<ArrayBuffer>,
	length: number,
	config?: {
		memory?: number;
		ops?: number;
	},
) => Promise<Uint8Array<ArrayBuffer>>;

export interface CryptographyUtilsWorker {
	deriveBits: DerivedBitsGenerator;
}
