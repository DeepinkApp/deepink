/* eslint-disable no-control-regex */
// ─────────────────────────────────────────────────────────────────────────────
// password-entropy.ts
// ─────────────────────────────────────────────────────────────────────────────

export type Strength = 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong';

export interface EntropyResult {
	entropy: number;
	strength: Strength;
}

export type Dictionary = Map<string, number>;

// ── Normalisation ─────────────────────────────────────────────────────────────

function normalise(s: string): string {
	return s
		.toLowerCase()
		.normalize('NFC')
		.replace(/0/g, 'o')
		.replace(/1/g, 'i')
		.replace(/3/g, 'e')
		.replace(/4/g, 'a')
		.replace(/5/g, 's')
		.replace(/7/g, 't')
		.replace(/@/g, 'a')
		.replace(/\$/g, 's')
		.replace(/!/g, 'i');
}

export function buildDictionary(words: string[]): Dictionary {
	const map: Dictionary = new Map();
	let rank = 1;
	for (const word of words) {
		const key = normalise(word);
		if (key && !map.has(key)) map.set(key, rank++);
	}
	return map;
}

// ── Entropy helpers ───────────────────────────────────────────────────────────

const split = (s: string): string[] => Array.from(s.normalize('NFC'));

function poolSize(password: string): number {
	let pool = 0;
	if (/[a-z]/.test(password)) pool += 26;
	if (/[A-Z]/.test(password)) pool += 26;
	if (/[0-9]/.test(password)) pool += 10;
	if (/[^a-zA-Z0-9]/.test(password)) pool += 32;
	if (/[^\x00-\x7F]/.test(password)) pool += 100_000;
	return Math.max(pool, 2);
}

function shannonPerChar(chars: string[]): number {
	const freq = new Map<string, number>();
	for (const ch of chars) freq.set(ch, (freq.get(ch) ?? 0) + 1);
	let H = 0;
	for (const count of freq.values()) {
		const p = count / chars.length;
		H -= p * Math.log2(p);
	}
	return H;
}

function bruteForceEntropy(chars: string[]): number {
	if (chars.length === 0) return 0;
	const s = chars.join('');
	const rep = chars.length === 1 ? 1 : shannonPerChar(chars) / Math.log2(chars.length);
	return Math.log2(poolSize(s)) * chars.length * rep;
}

function strengthLabel(entropy: number): Strength {
	if (entropy < 28) return 'very-weak';
	if (entropy < 50) return 'weak';
	if (entropy < 75) return 'fair';
	if (entropy < 100) return 'strong';
	return 'very-strong';
}

// ── DP decomposition ──────────────────────────────────────────────────────────

/**
 * Finds the minimum-entropy decomposition of the password.
 *
 * dp[i] = minimum entropy to explain the first i code-points.
 *
 * At each position i we try every possible previous position j:
 *   - chars[j..i] as a brute-force chunk
 *   - chars[j..i] as a dictionary word (O(1) Map lookup)
 *
 * Total lookups = n²/2, where n = password length ≤ ~100.
 * Dictionary size has zero impact on performance.
 */
function minEntropy(chars: string[], dictionary: Dictionary): number {
	const n = chars.length;
	const dp = new Array<number>(n + 1).fill(Infinity);
	dp[0] = 0;

	for (let end = 1; end <= n; end++) {
		for (let start = 0; start < end; start++) {
			if (dp[start] === Infinity) continue;

			const sub = chars.slice(start, end).join('');
			const exact = sub.toLowerCase().normalize('NFC');
			const leet = normalise(sub);
			const rank = dictionary.get(exact) ?? dictionary.get(leet);

			// Option A: dictionary match
			if (rank !== undefined) {
				const casePenalty = sub !== sub.toLowerCase() ? 1 : 0;
				const leetPenalty = leet !== exact ? 1 : 0;
				const cost = Math.log2(rank) + casePenalty + leetPenalty;
				dp[end] = Math.min(dp[end], dp[start] + cost);
			}

			// Option B: brute-force
			const cost = bruteForceEntropy(chars.slice(start, end));
			dp[end] = Math.min(dp[end], dp[start] + cost);
		}
	}

	return dp[n];
}

// ── Public API ────────────────────────────────────────────────────────────────

export function calcEntropy(password: string, dictionary?: Dictionary): EntropyResult {
	const chars = split(password);
	const L = chars.length;

	if (L === 0) return { entropy: 0, strength: 'very-weak' };

	const entropy = dictionary ? minEntropy(chars, dictionary) : bruteForceEntropy(chars);

	return { entropy, strength: strengthLabel(entropy) };
}
