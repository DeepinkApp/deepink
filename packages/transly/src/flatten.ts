/**
 * Recursively flattens a nested JSON object into dot-notation keys.
 *
 * Example:
 *   { nested: { message: "World" } }  →  { "nested.message": "World" }
 *
 * Only string leaf values are included. Non-string leaves (numbers, booleans,
 * null, arrays) are coerced to strings so no data is silently dropped.
 */
export function flattenJson(
	obj: Record<string, unknown>,
	prefix = '',
): Record<string, string> {
	const result: Record<string, string> = {};

	for (const [key, value] of Object.entries(obj)) {
		const fullKey = prefix ? `${prefix}.${key}` : key;

		if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
			const nested = flattenJson(value as Record<string, unknown>, fullKey);
			Object.assign(result, nested);
		} else {
			// Coerce non-string primitives to string
			// TODO: fix edge cases
			// eslint-disable-next-line @typescript-eslint/no-base-to-string
			result[fullKey] = String(value ?? '');
		}
	}

	return result;
}

/**
 * Reconstructs a nested JSON object from a flat dot-notation map.
 *
 * Example:
 *   { "nested.message": "World" }  →  { nested: { message: "World" } }
 */
export function unflattenJson(flat: Record<string, string>): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	for (const [flatKey, value] of Object.entries(flat)) {
		const parts = flatKey.split('.');
		let current = result;

		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i];
			if (
				!(part in current) ||
				typeof current[part] !== 'object' ||
				current[part] === null
			) {
				current[part] = {};
			}
			current = current[part] as Record<string, unknown>;
		}

		const lastPart = parts[parts.length - 1];
		current[lastPart] = value;
	}

	return result;
}
