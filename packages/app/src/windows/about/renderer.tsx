import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { LocalesProvider } from 'src/LocalesProvider';
import { patchWindow } from '@electron/requests/electronPatches/renderer';
import { ThemeProvider } from '@features/ThemeProvider';
import { loadStore } from '@state/redux/persistence';
import { store } from '@state/redux/store';

import { About } from './About';

const rootNode = document.getElementById('appRoot');
if (!rootNode) {
	throw new Error('Root node not found!');
}

document.body.style.overflow = 'hidden';

loadStore(store);

patchWindow();

const reactRoot = createRoot(rootNode);
reactRoot.render(
	<Provider store={store}>
		<ThemeProvider>
			<LocalesProvider>
				<About />
			</LocalesProvider>
		</ThemeProvider>
	</Provider>,
);
