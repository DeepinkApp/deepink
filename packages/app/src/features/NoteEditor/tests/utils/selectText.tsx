import { fireEvent } from '@testing-library/react';

export const selectText = (node: Text, start: number, end: number) => {
	const range = document.createRange();

	range.setStart(node, start);
	range.setEnd(node, end);

	window.getSelection()?.removeAllRanges();
	window.getSelection()?.addRange(range);

	fireEvent(document, new Event('selectionchange'));
};
