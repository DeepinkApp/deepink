import type { Config, TranslationItem } from './types.js';

/**
 * Extracts the assistant message text content from an OpenAI-compatible
 * chat completion response.
 */
function extractContent(json: unknown): string {
	if (
		typeof json !== 'object' ||
		json === null ||
		!('choices' in json) ||
		!Array.isArray((json as { choices: unknown }).choices)
	) {
		throw new Error(`Unexpected LLM response shape: ${JSON.stringify(json)}`);
	}

	const choices = (json as { choices: unknown[] }).choices;
	if (choices.length === 0) {
		throw new Error('LLM returned empty choices array');
	}

	const first = choices[0];
	if (
		typeof first !== 'object' ||
		first === null ||
		!('message' in first) ||
		typeof (first as { message: unknown }).message !== 'object'
	) {
		throw new Error(`Unexpected choice shape: ${JSON.stringify(first)}`);
	}

	const message = (first as { message: { content?: unknown } }).message;
	if (typeof message.content !== 'string') {
		throw new Error(
			`LLM message content is not a string: ${JSON.stringify(message.content)}`,
		);
	}

	return message.content;
}

/** Default OpenAI-compatible base URL */
const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * Expected shape of the LLM response: a JSON object mapping flat keys to
 * translated string values.
 *
 * Example:
 *   { "greeting": "Hallo", "nested.message": "Welt" }
 */
export type LlmTranslationResponse = Record<string, string>;

/**
 * Sends a batch of translation items to the LLM and returns the translated
 * key→value map.
 *
 * The LLM is instructed (via the system prompt) to return a JSON object where
 * each key maps to its translation in the target language.
 *
 * @param items - Items to translate in this batch
 * @param targetLang - Target language code (e.g. "de")
 * @param config - Validated user config
 * @returns Record mapping each key to its translated string
 * @throws Error on HTTP failure or malformed LLM response
 */
export async function translateChunk(
	items: TranslationItem[],
	targetLang: string,
	config: Config,
): Promise<LlmTranslationResponse> {
	const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
	const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

	const userContent = JSON.stringify({ targetLang, items });

	const body = {
		model: config.model,
		messages: [
			{ role: 'system', content: config.prompt },
			{ role: 'user', content: userContent },
		],
	};

	let response: Response;
	try {
		response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${config.apiKey}`,
			},
			body: JSON.stringify(body),
		});
	} catch (err) {
		throw new Error(
			`LLM request failed (network error): ${err instanceof Error ? err.message : String(err)}`,
		);
	}

	if (!response.ok) {
		const text = await response.text().catch(() => '');
		throw new Error(`LLM request failed with status ${response.status}: ${text}`);
	}

	let json: unknown;
	try {
		json = await response.json();
	} catch (err) {
		throw new Error(
			`Failed to parse LLM response as JSON: ${err instanceof Error ? err.message : String(err)}`,
		);
	}

	// Extract the assistant message content
	const content = extractContent(json);

	// Parse the content as JSON translation map
	let translations: unknown;
	try {
		// The LLM may wrap the JSON in markdown code fences — strip them
		const cleaned = content
			.replace(/^```(?:json)?\s*/i, '')
			.replace(/\s*```$/, '')
			.trim();
		translations = JSON.parse(cleaned);
	} catch (err) {
		throw new Error(
			`LLM returned non-JSON content: ${err instanceof Error ? err.message : String(err)}\nContent: ${content}`,
		);
	}

	if (
		typeof translations !== 'object' ||
		translations === null ||
		Array.isArray(translations)
	) {
		throw new Error(
			`LLM response is not a JSON object. Got: ${JSON.stringify(translations)}`,
		);
	}

	// Validate that all expected keys are present and values are strings
	const result: LlmTranslationResponse = {};
	for (const item of items) {
		const value = (translations as Record<string, unknown>)[item.key];
		if (typeof value !== 'string') {
			throw new Error(
				`LLM response missing or invalid translation for key "${item.key}". Got: ${JSON.stringify(value)}`,
			);
		}
		result[item.key] = value;
	}

	return result;
}
