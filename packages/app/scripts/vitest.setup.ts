require('@testing-library/jest-dom');
require('blob-polyfill');

// JSdom does not perform real image loading, so the Image `onload` event is never triggered
// Mock it to allow components that depend on image loading (such as ImageNode) to render correctly
class MockImage {
	onload = () => {};

	set src(_: string) {
		queueMicrotask(() => this.onload());
	}
}
global.Image = MockImage as any;

// Mock this function because jsdom does not implement the layout API; getClientRects returns an object without the `item` method,
// causing HighlightingPlugin to crash
Element.prototype.getClientRects = () =>
	({
		item: () => null,
		length: 0,
		[Symbol.iterator]: () => {},
	}) as unknown as DOMRectList;

// Mock this function because the Rich Editor uses it to calculate cursor and selection positions.
// Tests may fail without it
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
