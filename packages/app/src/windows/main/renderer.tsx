import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createEvent } from 'effector';
import { LocalesProvider } from 'src/LocalesProvider';
import { EventBus } from '@api/events/EventBus';
import { GlobalEventsPayloadMap } from '@api/events/global';
import { Toaster } from '@components/ui/toaster';
import { IFilesStorage } from '@core/features/files';
import { IndexedDBFS } from '@core/features/files/IndexedDBFS';
import { InMemoryFS } from '@core/features/files/InMemoryFS';
import { patchWindow } from '@electron/requests/electronPatches/renderer';
import { ElectronFilesController, storageApi } from '@electron/requests/storage/renderer';
import { telemetry } from '@electron/requests/telemetry/renderer';
import { hasElectronApi } from '@electron/utils/renderer';
import { App } from '@features/App/index';
import { FilesStorageContext } from '@features/files';
import { TelemetryContext } from '@features/telemetry';
import { ThemeProvider } from '@features/ThemeProvider';
import { CommandEventProvider } from '@hooks/commands/CommandEventProvider';
import { GlobalEventBusContext } from '@hooks/events/useEventBus';
import { loadStore, persistStore } from '@state/redux/persistence';
import { store } from '@state/redux/store';

patchWindow();

const rootNode = document.getElementById('appRoot');
if (!rootNode) {
	throw new Error('Root node not found!');
}

document.body.style.overflow = 'hidden';

loadStore(store);
persistStore(store);

const event = createEvent<{
	name: string;
	payload: any;
}>();

const globalEventBus = {
	emit(eventName: string, payload?: any) {
		event({ name: eventName, payload });
	},
	listen(eventName, callback) {
		return event.watch((event) => {
			if (event.name !== eventName) return;

			callback(event.payload);
		});
	},
} satisfies EventBus<GlobalEventsPayloadMap>;

let filesController: IFilesStorage;
switch (localStorage.storageType) {
	case 'idb':
		filesController = new IndexedDBFS('deepink');
		break;
	case 'ram':
		filesController = new InMemoryFS();
		break;

	default:
		filesController = new ElectronFilesController(storageApi, `/`);
		break;
}

const reactRoot = createRoot(rootNode);
reactRoot.render(
	<TelemetryContext
		value={
			hasElectronApi()
				? telemetry
				: {
						async getState() {
							return { uid: '', queue: [] };
						},
						async track() {},
						async handleQueue() {
							return { total: 0, processed: 0 };
						},
					}
		}
	>
		<Provider store={store}>
			<GlobalEventBusContext value={globalEventBus}>
				<FilesStorageContext value={filesController}>
					<CommandEventProvider>
						<ThemeProvider>
							<LocalesProvider>
								<App />
								<Toaster />
							</LocalesProvider>
						</ThemeProvider>
					</CommandEventProvider>
				</FilesStorageContext>
			</GlobalEventBusContext>
		</Provider>
	</TelemetryContext>,
);
