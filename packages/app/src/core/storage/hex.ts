export function bytesToHex(bytes: Uint8Array): string {
	let hex = '';
	for (let i = 0; i < bytes.length; i++) {
		const h = bytes[i].toString(16).padStart(2, '0');
		hex += h;
	}
	return hex;
}

export function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
	if (hex.length % 2 !== 0) {
		throw new Error('Invalid hex string');
	}

	const bytes = new Uint8Array(hex.length / 2);

	for (let i = 0; i < bytes.length; i++) {
		const byte = hex.slice(i * 2, i * 2 + 2);
		const value = Number.parseInt(byte, 16);
		if (Number.isNaN(value)) {
			throw new Error('Invalid hex string');
		}
		bytes[i] = value;
	}

	return bytes;
}
