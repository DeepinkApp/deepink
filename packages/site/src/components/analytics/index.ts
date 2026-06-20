import {
	enableAutoOutboundTracking,
	enableAutoPageviews,
	enableEngagementTracking,
	enableLinkClicksCapture,
	enableSessionScoring,
	filters,
	Plausible,
	skipForHosts,
	transformers,
	userId,
} from 'plausible-client';
import { getSessionId } from 'plausible-client/utils/uid';

export const createPlausibleInstance = () => {
	const plausible = new Plausible({
		apiHost: 'https://uxt.vitonsky.net',
		domain: 'deepink.app',
		filter: filters(skipForHosts(['localhost'])),
		transform: transformers(userId(), (event) => {
			let sessionId = sessionStorage.getItem('sessionId');
			if (!sessionId) {
				sessionId = getSessionId();
				sessionStorage.setItem('sessionId', sessionId);
			}

			event.props = {
				...event.props,
				sessionId,
			};
			return event;
		}),
	});

	const cleanups: ((() => void) | void)[] = [];

	if (typeof window !== 'undefined') {
		cleanups.push(enableAutoPageviews(plausible));
		cleanups.push(enableEngagementTracking(plausible));
		cleanups.push(enableSessionScoring(plausible));

		cleanups.push(enableAutoOutboundTracking(plausible, { captureText: true }));
		cleanups.push(enableLinkClicksCapture(plausible, { captureText: true }));
	}

	return {
		plausible,
		cleanup: () => {
			cleanups.forEach((stop) => stop?.());
		},
	};
};

export enum ANALYTICS_EVENT {
	DOWNLOAD_BUTTON_CLICK = 'Download button click',
	LANGUAGE_VERSION_CLICK = 'Language version click',
	PAGE_404 = '404',
	SHARE_LINK = 'Share link click',
	MOBILE_MENU = 'Mobile menu click',
	FEATURES_CLICK = 'Features button click',
	FAQ_CLICK = 'FAQ: Item click',
}

export type ANALYTICS_EVENT_PAYLOADS = {
	[ANALYTICS_EVENT.DOWNLOAD_BUTTON_CLICK]: {
		context: string;
		fileName?: string;
	};
	[ANALYTICS_EVENT.LANGUAGE_VERSION_CLICK]: {
		languageCode: string;
	};
	[ANALYTICS_EVENT.SHARE_LINK]: {
		method: string;
	};
	[ANALYTICS_EVENT.MOBILE_MENU]: {
		state: 'opened' | 'closed';
	};
};
