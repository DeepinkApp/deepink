// plugins/remark-mermaid.ts
import { visit } from 'unist-util-visit';

// TODO: replace mermaid to something that can be rendered locally with no Playwright:
// https://github.com/mdaines/viz-js
// https://www.npmjs.com/package/nomnoml

/**
 * Render the mermaid diagrams into inline SVG documents
 */
export default function remarkMermaid() {
	return async (tree: any) => {
		const nodes: any[] = [];

		visit(tree, 'code', (node: any) => {
			if (node.lang === 'mermaid') nodes.push(node);
		});

		await Promise.all(
			nodes.map(async (node) => {
				const encoded = Buffer.from(node.value).toString('base64url');
				const url = `https://mermaid.ink/svg/${encoded}`;

				try {
					const res = await fetch(url);
					if (!res.ok) {
						throw new Error(
							`mermaid.ink returned [${res.status}] ${res.statusText}`,
						);
					}
					const svg = await res.text();
					node.type = 'html';
					node.value = svg;
				} catch (error) {
					console.warn(`[remarkMermaid] failed to render diagram: ${error}`);
					// Leave the original code block intact as a fallback
				}
			}),
		);
	};
}
