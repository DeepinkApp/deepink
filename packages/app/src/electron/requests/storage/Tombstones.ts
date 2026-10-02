export class Tombstones<K, V> {
	private readonly entries = new Map<
		K,
		{ value: V; expiresAt: number; timer: ReturnType<typeof setTimeout> }
	>();

	constructor(private readonly timeoutMs: number) {
		if (!Number.isFinite(timeoutMs) || timeoutMs < 0)
			throw new Error('Tombstone timeout must be a non-negative number');
	}

	public set(key: K, value: V) {
		this.delete(key);

		const entry = {
			value,
			expiresAt: Date.now() + this.timeoutMs,
			timer: undefined as unknown as ReturnType<typeof setTimeout>,
		};

		entry.timer = setTimeout(() => this.expire(key, entry), this.timeoutMs);
		this.entries.set(key, entry);
	}

	public get(key: K): V | undefined {
		const entry = this.entries.get(key);
		if (!entry) return undefined;

		// Also enforce expiry if the timer callback has not run yet.
		if (entry.expiresAt <= Date.now()) {
			this.expire(key, entry);
			return undefined;
		}

		return entry.value;
	}

	public delete(key: K) {
		const entry = this.entries.get(key);
		if (!entry) return false;

		clearTimeout(entry.timer);
		return this.entries.delete(key);
	}

	public clear() {
		for (const entry of this.entries.values()) clearTimeout(entry.timer);
		this.entries.clear();
	}

	private expire(
		key: K,
		expected: { value: V; expiresAt: number; timer: ReturnType<typeof setTimeout> },
	) {
		// Don't let an old timer remove a newer tombstone for the same key.
		if (this.entries.get(key) !== expected) return;

		clearTimeout(expected.timer);
		this.entries.delete(key);
	}
}
