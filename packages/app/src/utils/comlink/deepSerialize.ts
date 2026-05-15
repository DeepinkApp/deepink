// comlink/deepObjectTransferHandler.ts
import { transferHandlers } from 'comlink';

const MARKER = '__deep_object__' as const;

type SerializedNode =
	| { t: 'primitive'; v: unknown }
	| { t: 'proxy'; v: unknown }
	| { t: 'signal'; v: MessagePort }
	| { t: 'array'; v: SerializedNode[] }
	| { t: 'object'; v: Record<string, SerializedNode> };

function serialize(val: unknown): {
	node: SerializedNode;
	transferables: Transferable[];
} {
	const transferables: Transferable[] = [];

	function walk(v: unknown): SerializedNode {
		if (v === null || v === undefined) {
			return { t: 'primitive', v };
		}

		if (typeof v !== 'object' && typeof v !== 'function') {
			return { t: 'primitive', v };
		}

		if (typeof v === 'function') {
			const proxyHandler = transferHandlers.get('proxy')!;
			const [serialized, transfers] = proxyHandler.serialize(v);
			transferables.push(...transfers);
			return { t: 'proxy', v: serialized };
		}

		if (v instanceof AbortSignal) {
			const { port1, port2 } = new MessageChannel();
			v.addEventListener(
				'abort',
				() => {
					port1.postMessage({ type: 'abort', reason: v.reason });
					port1.close();
				},
				{ once: true },
			);
			transferables.push(port2);
			return { t: 'signal', v: port2 };
		}

		if (Array.isArray(v)) {
			return { t: 'array', v: v.map(walk) };
		}

		if (typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) {
			return {
				t: 'object',
				v: Object.fromEntries(
					Object.entries(v).map(([k, val]) => [k, walk(val)]),
				),
			};
		}

		// Class instances and anything else → proxy
		const proxyHandler = transferHandlers.get('proxy')!;
		const [serialized, transfers] = proxyHandler.serialize(v);
		transferables.push(...transfers);
		return { t: 'proxy', v: serialized };
	}

	return { node: walk(val), transferables };
}

function deserialize(node: SerializedNode): unknown {
	const proxyHandler = transferHandlers.get('proxy')!;

	switch (node.t) {
		case 'primitive':
			return node.v;

		case 'proxy':
			return proxyHandler.deserialize(node.v);

		case 'signal': {
			const controller = new AbortController();
			const port = node.v;
			port.onmessage = (e) => {
				if (e.data?.type === 'abort') {
					controller.abort(e.data.reason);
					port.close();
				}
			};
			port.start();
			return controller.signal;
		}

		case 'array':
			return node.v.map(deserialize);

		case 'object':
			return Object.fromEntries(
				Object.entries(node.v).map(([k, child]) => [k, deserialize(child)]),
			);
	}
}

export type DeepObject<T extends object> = T & { [MARKER]: true };

export function deepObject<T extends object>(val: T): DeepObject<T> {
	return Object.assign(val, { [MARKER]: true }) as DeepObject<T>;
}

export function registerDeepObjectTransferHandler() {
	transferHandlers.set('deep_object', {
		canHandle(val): val is DeepObject<object> {
			return typeof val === 'object' && val !== null && MARKER in val;
		},

		serialize(val: DeepObject<object>) {
			const { [MARKER]: _, ...rest } = val as Record<string, unknown>;
			const { node, transferables } = serialize(rest);
			return [node, transferables];
		},

		deserialize(node: SerializedNode) {
			return deserialize(node);
		},
	});
}
