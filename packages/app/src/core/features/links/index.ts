import { Uri } from 'monaco-editor-core';

/**
 * URL protocol names for app
 */
export const AppUrlProtocols = {
	resource: 'res',
	note: 'note',
} as const;

export const formatResourceLink = (resourceId: string) =>
	`${AppUrlProtocols.resource}://${resourceId}`;

export const formatNoteLink = (noteId: string) => `${AppUrlProtocols.note}://${noteId}`;

export const findLinksInText = (
	text: string,
): {
	index: number;
	url: string;
}[] => {
	return Array.from(
		text.matchAll(
			new RegExp(
				`(${Object.values(AppUrlProtocols).join('|')}):\\/\\/[\\da-z\\-]+`,
				'gi',
			),
		),
	).map((match) => {
		const index = match.index;
		const url = match[0];

		if (index === undefined) throw new TypeError('Substring index not found');

		return { index, url };
	});
};

type URLProtocolsMap = typeof AppUrlProtocols;
export const getAppResourceDataInUrl = (
	url: URL | Uri | string,
): null | {
	type: keyof URLProtocolsMap;
	id: string;
} => {
	const urlProtocols = Object.entries(AppUrlProtocols) as [
		keyof URLProtocolsMap,
		URLProtocolsMap[keyof URLProtocolsMap],
	][];

	if (typeof url === 'string') {
		const protocol = urlProtocols.find(([_, protocol]) =>
			url.startsWith(protocol + '://'),
		);
		if (!protocol) return null;

		const [name, symbol] = protocol;

		const urlPrefix = symbol + '://';
		const idInUrl = url.slice(urlPrefix.length);
		if (idInUrl.length === 0) return null;

		return {
			type: name,
			id: idInUrl,
		};
	}

	if (url instanceof URL) {
		const protocol = urlProtocols.find(([_, protocol]) => protocol === url.protocol);
		if (!protocol) return null;

		const [name] = protocol;

		return {
			type: name,
			id: url.host,
		};
	}

	const protocol = urlProtocols.find(([_, protocol]) => protocol === url.scheme);
	if (!protocol) return null;

	const [name] = protocol;

	return {
		type: name,
		id: url.authority,
	};
};

export const getResourceIdInUrl = (url: URL | Uri | string) => {
	const resourceData = getAppResourceDataInUrl(url);
	if (!resourceData || resourceData.type !== 'resource') return null;
	return resourceData.id;
};

export const isResourceUrl = (url: URL | Uri | string) => {
	const resourceData = getAppResourceDataInUrl(url);
	return resourceData !== null && resourceData.type === 'resource';
};
