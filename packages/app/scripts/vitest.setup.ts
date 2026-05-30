// Run only in browser-like env
const isDOMLikeEnv = typeof window !== 'undefined' && typeof document !== 'undefined';
if (isDOMLikeEnv) {
	require('@testing-library/jest-dom');
	require('blob-polyfill');

	// jsdom does not perform real image loading, so Image.onload is never triggered
	// This can block components that rely on image load (like Image Node) to render or update DOM, so we mock it
	class MockImage {
		onload = () => {};

		set src(_: string) {
			queueMicrotask(() => this.onload());
		}
	}
	global.Image = MockImage as any;

	// jsdom does not implement layout APIs - getClientRects() returns an object without item(),
	// which causes HighlightingPlugin to crash. Mock it to return a valid empty DOMRectList
	Element.prototype.getClientRects = () =>
		({
			item: () => null,
			length: 0,
			[Symbol.iterator]: () => {},
		}) as unknown as DOMRectList;

	// Mock it because the Rich editor uses it to compute selection position and tests break without it
	Range.prototype.getBoundingClientRect = () => ({
		width: 0,
		height: 0,
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		x: 0,
		y: 0,
		toJSON: () => {},
	});
}
