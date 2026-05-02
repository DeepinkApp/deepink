import { AppUpdatesChecker } from '../AppUpdatesChecker';
import versions from './versions.json';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const mockServerResponse = (payload: any) => {
	mockFetch.mockImplementation(
		() => new Response(JSON.stringify(payload), { status: 200 }),
	);
};

beforeEach(() => {
	vi.clearAllMocks();
	mockServerResponse(versions);
});

const updatesChecker = new AppUpdatesChecker({ host: 'https://site.com' });

test('Greater version must be considered as new version', async () => {
	const latestVersion = {
		url: 'https://github.com/DeepinkApp/deepink/releases/tag/v0.0.2-preview.8',
		version: '0.0.2-preview.8',
	};

	await expect(
		updatesChecker.getUpdate({
			version: '0.0.1',
		}),
	).resolves.toEqual(latestVersion);

	await expect(
		updatesChecker.getUpdate({
			version: '0.0.1-preview.1',
		}),
	).resolves.toEqual(latestVersion);

	await expect(
		updatesChecker.getUpdate({
			version: '0.0.1-preview.999',
		}),
	).resolves.toEqual(latestVersion);

	await expect(
		updatesChecker.getUpdate({
			version: '0.0.2-preview.1',
		}),
	).resolves.toEqual(latestVersion);

	await expect(
		updatesChecker.getUpdate({
			version: '0.0.2-preview.7',
		}),
	).resolves.toEqual(latestVersion);

	await expect(
		updatesChecker.getUpdate({
			version: '0.0.2-preview.8',
		}),
	).resolves.toEqual(null);

	await expect(
		updatesChecker.getUpdate({
			version: '0.0.2-preview.9',
		}),
	).resolves.toEqual(null);

	await expect(
		updatesChecker.getUpdate({
			version: '1.0.0',
		}),
	).resolves.toEqual(null);

	await expect(
		updatesChecker.getUpdate({
			version: '1.1.1',
		}),
	).resolves.toEqual(null);
});

test('Returns null for a network errors', async () => {
	const spyError = vi.spyOn(console, 'error');
	mockFetch.mockImplementation(() => {
		throw new Error('Network error emulation');
	});

	await expect(
		updatesChecker.getUpdate({
			version: '0.0.1',
		}),
	).resolves.toEqual(null);

	expect(spyError).toBeCalledWith(new Error('Network error emulation'));
});
