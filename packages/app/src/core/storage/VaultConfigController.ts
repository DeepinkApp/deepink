import { IFilesStorage } from '@core/features/files';
import { FileController } from '@core/features/files/FileController';
import { StateFile } from '@core/features/files/StateFile';

import { VaultPublicConfig, VaultPublicConfigScheme } from './VaultController';

export class VaultConfigController {
	private readonly configFile = '/vault-config.json';
	private readonly configState;
	constructor(files: IFilesStorage) {
		this.configState = new StateFile(
			new FileController(this.configFile, files),
			VaultPublicConfigScheme,
		);
	}

	public async set(config: VaultPublicConfig) {
		await this.configState.set(config);
	}

	public async get() {
		return this.configState.get();
	}
}
