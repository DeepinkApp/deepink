import electron from 'electron';

const webFrame = (electron?.webFrame ?? null) as Electron.WebFrame | null;

export function getDevicePixelRatio() {
	if (!webFrame) return 1;

	const zoomFactor = webFrame.getZoomFactor();

	// Temporary reset current zoom factor to get real DPR
	webFrame.setZoomFactor(1);

	const dpr = window.devicePixelRatio;
	webFrame.setZoomFactor(zoomFactor);

	return dpr;
}

export function getDefaultZoomFactor() {
	return 1;
}

export function setZoomFactor(zoom: number) {
	if (!webFrame) return;

	// Reset current zoom factor to prevent cascade zoom
	webFrame.setZoomFactor(1);
	webFrame.setZoomFactor(zoom);

	localStorage.zoom = zoom;
}

export function getZoomFactor() {
	if (!webFrame) return 1;
	return webFrame.getZoomFactor();
}

export function initZoomFactor() {
	if (!localStorage.zoom) return;

	const zoomFactor = Number(localStorage.zoom);
	if (isNaN(zoomFactor)) {
		console.warn('Zoom factor have an invalid value');
		return;
	}

	setZoomFactor(zoomFactor);
}
