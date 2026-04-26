/* eslint-disable @cspell/spellchecker */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { translateChunk } from '../src/llm.js';
import type { TranslationItem } from '../src/types.js';
import { makeConfig } from './stubs/makeConfig.js';
import {
	makeFetchStub,
	makeFetchStubText,
	makeNetworkErrorStub,
	makeOpenAiResponse,
} from './stubs/makeFetchStub.js';

afterEach(() => {
	vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const items: TranslationItem[] = [
	{ key: 'greeting', value: 'Hello' },
	{ key: 'farewell', value: 'Goodbye' },
];

function stubFetch(fetchFn: typeof fetch) {
	vi.stubGlobal('fetch', fetchFn);
}

function okResponse(translations: Record<string, string>) {
	return makeFetchStub(200, makeOpenAiResponse(JSON.stringify(translations)));
}

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe('translateChunk — happy path', () => {
	it('returns a key→value map for a successful response', async () => {
		stubFetch(okResponse({ greeting: 'Hallo', farewell: 'Auf Wiedersehen' }));

		const result = await translateChunk(items, 'de', makeConfig());

		expect(result).toEqual({ greeting: 'Hallo', farewell: 'Auf Wiedersehen' });
	});

	it('strips markdown code fences wrapping the JSON', async () => {
		const fenced = '```json\n{"greeting":"Hallo","farewell":"Auf Wiedersehen"}\n```';
		stubFetch(makeFetchStub(200, makeOpenAiResponse(fenced)));

		const result = await translateChunk(items, 'de', makeConfig());

		expect(result).toEqual({ greeting: 'Hallo', farewell: 'Auf Wiedersehen' });
	});

	it('strips plain code fences (no language tag)', async () => {
		const fenced = '```\n{"greeting":"Hallo","farewell":"Auf Wiedersehen"}\n```';
		stubFetch(makeFetchStub(200, makeOpenAiResponse(fenced)));

		const result = await translateChunk(items, 'de', makeConfig());

		expect(result).toEqual({ greeting: 'Hallo', farewell: 'Auf Wiedersehen' });
	});
});

// ---------------------------------------------------------------------------
// Request shape
// ---------------------------------------------------------------------------

describe('translateChunk — outgoing request', () => {
	it('sends a POST to the correct endpoint with auth header', async () => {
		let capturedUrl = '';
		let capturedInit: RequestInit | undefined;
		vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
			capturedUrl = url;
			capturedInit = init;
			return new Response(
				JSON.stringify(
					makeOpenAiResponse(
						JSON.stringify({ greeting: 'Hallo', farewell: 'Tschüss' }),
					),
				),
				{ status: 200 },
			);
		});

		await translateChunk(items, 'de', makeConfig({ apiKey: 'sk-test-123' }));

		expect(capturedUrl).toContain('/chat/completions');
		expect(capturedInit!.method).toBe('POST');
		expect((capturedInit!.headers as Record<string, string>)['Authorization']).toBe(
			'Bearer sk-test-123',
		);
		expect((capturedInit!.headers as Record<string, string>)['Content-Type']).toBe(
			'application/json',
		);
	});

	it('sends model, system prompt, and user content in the request body', async () => {
		let capturedBody: unknown;
		vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
			capturedBody = JSON.parse(init.body as string);
			return new Response(
				JSON.stringify(
					makeOpenAiResponse(
						JSON.stringify({ greeting: 'Hallo', farewell: 'Tschüss' }),
					),
				),
				{ status: 200 },
			);
		});

		const config = makeConfig({
			model: 'openai/gpt-4o-mini',
			systemPrompt: 'Translate carefully.',
		});
		await translateChunk(items, 'de', config);

		const body = capturedBody as {
			model: string;
			messages: { role: string; content: string }[];
		};
		expect(body.model).toBe('openai/gpt-4o-mini');
		expect(body.messages[0].role).toBe('system');
		expect(body.messages[0].content).toBe('Translate carefully.');
		expect(body.messages[1].role).toBe('user');

		const userPayload = JSON.parse(body.messages[1].content) as {
			targetLang: string;
			items: TranslationItem[];
		};
		expect(userPayload.targetLang).toBe('de');
		expect(userPayload.items).toEqual(items);
	});

	it('uses the default OpenRouter base URL when baseUrl is not set', async () => {
		let capturedUrl = '';
		vi.stubGlobal('fetch', async (url: string) => {
			capturedUrl = url;
			return new Response(
				JSON.stringify(
					makeOpenAiResponse(
						JSON.stringify({ greeting: 'Hallo', farewell: 'Tschüss' }),
					),
				),
				{ status: 200 },
			);
		});

		await translateChunk(items, 'de', makeConfig({ baseUrl: undefined }));

		expect(capturedUrl).toBe('https://openrouter.ai/api/v1/chat/completions');
	});

	it('uses a custom baseUrl when provided', async () => {
		let capturedUrl = '';
		vi.stubGlobal('fetch', async (url: string) => {
			capturedUrl = url;
			return new Response(
				JSON.stringify(
					makeOpenAiResponse(
						JSON.stringify({ greeting: 'Hallo', farewell: 'Tschüss' }),
					),
				),
				{ status: 200 },
			);
		});

		await translateChunk(items, 'de', makeConfig({ baseUrl: 'https://my.proxy/v1' }));

		expect(capturedUrl).toBe('https://my.proxy/v1/chat/completions');
	});

	it('strips trailing slash from baseUrl', async () => {
		let capturedUrl = '';
		vi.stubGlobal('fetch', async (url: string) => {
			capturedUrl = url;
			return new Response(
				JSON.stringify(
					makeOpenAiResponse(
						JSON.stringify({ greeting: 'Hallo', farewell: 'Tschüss' }),
					),
				),
				{ status: 200 },
			);
		});

		await translateChunk(
			items,
			'de',
			makeConfig({ baseUrl: 'https://my.proxy/v1/' }),
		);

		expect(capturedUrl).toBe('https://my.proxy/v1/chat/completions');
	});
});

// ---------------------------------------------------------------------------
// Network errors
// ---------------------------------------------------------------------------

describe('translateChunk — network errors', () => {
	it('throws a descriptive error when fetch rejects (network failure)', async () => {
		stubFetch(makeNetworkErrorStub('Failed to fetch'));

		await expect(translateChunk(items, 'de', makeConfig())).rejects.toThrow(
			'LLM request failed (network error)',
		);
	});

	it('includes the original error message in the network error', async () => {
		stubFetch(makeNetworkErrorStub('ECONNREFUSED'));

		await expect(translateChunk(items, 'de', makeConfig())).rejects.toThrow(
			'ECONNREFUSED',
		);
	});
});

// ---------------------------------------------------------------------------
// HTTP error status codes
// ---------------------------------------------------------------------------

describe('translateChunk — HTTP errors', () => {
	it('throws on 401 Unauthorized (invalid API key)', async () => {
		stubFetch(makeFetchStub(401, { error: 'Invalid API key' }));

		await expect(translateChunk(items, 'de', makeConfig())).rejects.toThrow('401');
	});

	it('throws on 429 Too Many Requests (rate limit)', async () => {
		stubFetch(makeFetchStub(429, { error: { message: 'Rate limit exceeded' } }));

		await expect(translateChunk(items, 'de', makeConfig())).rejects.toThrow('429');
	});

	it('throws on 500 Internal Server Error', async () => {
		stubFetch(makeFetchStub(500, { error: 'Internal server error' }));

		await expect(translateChunk(items, 'de', makeConfig())).rejects.toThrow('500');
	});

	it('throws on 503 Service Unavailable', async () => {
		stubFetch(makeFetchStubText(503, 'Service Unavailable'));

		await expect(translateChunk(items, 'de', makeConfig())).rejects.toThrow('503');
	});
});

// ---------------------------------------------------------------------------
// Malformed / unexpected LLM responses
// ---------------------------------------------------------------------------

describe('translateChunk — malformed responses', () => {
	it('throws when the response body is not valid JSON', async () => {
		stubFetch(makeFetchStubText(200, 'this is not json'));

		await expect(translateChunk(items, 'de', makeConfig())).rejects.toThrow();
	});

	it('throws when `choices` field is missing', async () => {
		stubFetch(makeFetchStub(200, { id: 'test', object: 'chat.completion' }));

		await expect(translateChunk(items, 'de', makeConfig())).rejects.toThrow(
			'Unexpected LLM response shape',
		);
	});

	it('throws when `choices` array is empty', async () => {
		stubFetch(makeFetchStub(200, { choices: [] }));

		await expect(translateChunk(items, 'de', makeConfig())).rejects.toThrow(
			'empty choices',
		);
	});

	it('throws when `message.content` is null', async () => {
		stubFetch(
			makeFetchStub(200, {
				choices: [{ message: { role: 'assistant', content: null } }],
			}),
		);

		await expect(translateChunk(items, 'de', makeConfig())).rejects.toThrow(
			'not a string',
		);
	});

	it('throws when content is a plain string (not JSON)', async () => {
		stubFetch(
			makeFetchStub(200, makeOpenAiResponse('Sure, here are the translations!')),
		);

		await expect(translateChunk(items, 'de', makeConfig())).rejects.toThrow(
			'non-JSON content',
		);
	});

	it('throws when content is a JSON array instead of an object', async () => {
		stubFetch(makeFetchStub(200, makeOpenAiResponse('[1, 2, 3]')));

		await expect(translateChunk(items, 'de', makeConfig())).rejects.toThrow(
			'not a JSON object',
		);
	});

	it('throws when a requested key is missing from the translation map', async () => {
		// Only returns 'greeting', missing 'farewell'
		stubFetch(okResponse({ greeting: 'Hallo' }));

		await expect(translateChunk(items, 'de', makeConfig())).rejects.toThrow(
			'"farewell"',
		);
	});

	it('throws when a key value is not a string', async () => {
		stubFetch(
			makeFetchStub(
				200,
				makeOpenAiResponse(JSON.stringify({ greeting: 'Hallo', farewell: 42 })),
			),
		);

		await expect(translateChunk(items, 'de', makeConfig())).rejects.toThrow(
			'"farewell"',
		);
	});
});
