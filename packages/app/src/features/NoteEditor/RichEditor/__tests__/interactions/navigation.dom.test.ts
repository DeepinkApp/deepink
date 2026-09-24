import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderRichEditor } from '../utils/renderRichEditor';
import { selectContent, setCursorPosition } from '../utils/utils';

test('Moves a paragraph up', async () => {
	const user = userEvent.setup();
	await renderRichEditor({
		value: 'The text about some interesting \n\n Boring text',
	});

	const editor = screen.getByRole('textbox');
	const paragraphs = within(editor).getAllByRole('paragraph');
	expect(paragraphs).toHaveLength(2);
	expect(paragraphs[0]).toHaveTextContent('The text about some interesting');
	expect(paragraphs[1]).toHaveTextContent('Boring text');

	await user.click(paragraphs[1]);
	setCursorPosition(paragraphs[1], 0);
	await user.keyboard('{Alt>}{ArrowUp}{/Alt}');

	const paragraphsAfterMove = within(editor).getAllByRole('paragraph');

	expect(paragraphsAfterMove).toHaveLength(2);
	expect(paragraphsAfterMove[0]).toHaveTextContent('Boring text');
	expect(paragraphsAfterMove[1]).toHaveTextContent('The text about some interesting');
});

test('Moves a paragraph down', async () => {
	const user = userEvent.setup();
	await renderRichEditor({
		value: 'The text about some interesting \n\n Boring text',
	});

	const editor = screen.getByRole('textbox');
	const paragraphs = within(editor).getAllByRole('paragraph');
	expect(paragraphs).toHaveLength(2);
	expect(paragraphs[0]).toHaveTextContent('The text about some interesting');
	expect(paragraphs[1]).toHaveTextContent('Boring text');

	await user.click(paragraphs[0]);
	setCursorPosition(paragraphs[0], 0);
	await user.keyboard('{Alt>}{ArrowDown}{/Alt}');

	const paragraphsAfterMove = within(editor).getAllByRole('paragraph');

	expect(paragraphsAfterMove).toHaveLength(2);
	expect(paragraphsAfterMove[0]).toHaveTextContent('Boring text');
	expect(paragraphsAfterMove[1]).toHaveTextContent('The text about some interesting');
});

test('Moves selection down and back up', async () => {
	const user = userEvent.setup();
	await renderRichEditor({ value: 'Green cup \n\n Red cup \n\n Black cup' });

	const editor = screen.getByRole('textbox');
	const paragraphs = within(editor).getAllByRole('paragraph');
	expect(paragraphs).toHaveLength(3);

	expect(paragraphs[0]).toHaveTextContent('Green cup');
	expect(paragraphs[1]).toHaveTextContent('Red cup');
	expect(paragraphs[2]).toHaveTextContent('Black cup');

	await user.click(paragraphs[1]);
	selectContent(editor, 'Green cup', 'Red cup');
	await user.keyboard('{Alt>}{ArrowDown}{/Alt}');

	const paragraphsAfterDown = within(editor).getAllByRole('paragraph');
	expect(paragraphsAfterDown).toHaveLength(3);

	expect(paragraphsAfterDown[0]).toHaveTextContent('Black cup');
	expect(paragraphsAfterDown[1]).toHaveTextContent('Green cup');
	expect(paragraphsAfterDown[2]).toHaveTextContent('Red cup');

	await user.click(paragraphsAfterDown[1]);
	selectContent(editor, 'Green cup', 'Red cup');
	await user.keyboard('{Alt>}{ArrowUp}{/Alt}');

	const paragraphsAfterUp = within(editor).getAllByRole('paragraph');
	expect(paragraphsAfterUp).toHaveLength(3);

	expect(paragraphsAfterUp[0]).toHaveTextContent('Green cup');
	expect(paragraphsAfterUp[1]).toHaveTextContent('Red cup');
	expect(paragraphsAfterUp[2]).toHaveTextContent('Black cup');
});

test('Moves a list item down with its nested list', async () => {
	const user = userEvent.setup();
	await renderRichEditor({
		value: `- First item
    - Nested item
- Third item`,
	});

	const editor = screen.getByRole('textbox');
	expect(within(editor).getAllByRole('list')).toHaveLength(2);

	const items = within(editor).getAllByRole('listitem');
	expect(items).toHaveLength(3);
	expect(items[0]).toContainElement(items[1]);

	expect(items[0]).toHaveTextContent('First item');
	expect(items[1]).toHaveTextContent('Nested item');
	expect(items[2]).toHaveTextContent('Third item');

	await user.click(items[0]);
	setCursorPosition(items[0], 0);
	await user.keyboard('{Alt>}{ArrowDown}{/Alt}');

	const itemsAfterMove = within(editor).getAllByRole('listitem');
	expect(itemsAfterMove).toHaveLength(3);

	expect(itemsAfterMove[0]).toHaveTextContent('Third item');
	expect(itemsAfterMove[1]).toHaveTextContent('First item');
	expect(itemsAfterMove[2]).toHaveTextContent('Nested item');

	expect(itemsAfterMove[1]).toContainElement(itemsAfterMove[2]);
});

test('Moves a list item up with its nested list', async () => {
	const user = userEvent.setup();
	await renderRichEditor({
		value: `- First item
    - Nested item
- Third item`,
	});

	const editor = screen.getByRole('textbox');
	expect(within(editor).getAllByRole('list')).toHaveLength(2);

	const items = within(editor).getAllByRole('listitem');
	expect(items).toHaveLength(3);
	expect(items[0]).toContainElement(items[1]);

	expect(items[0]).toHaveTextContent('First item');
	expect(items[1]).toHaveTextContent('Nested item');
	expect(items[2]).toHaveTextContent('Third item');

	await user.click(items[2]);
	setCursorPosition(items[2], 0);
	await user.keyboard('{Alt>}{ArrowUp}{/Alt}');

	const itemsAfterMove = within(editor).getAllByRole('listitem');
	expect(itemsAfterMove).toHaveLength(3);

	expect(itemsAfterMove[0]).toHaveTextContent('Third item');
	expect(itemsAfterMove[1]).toHaveTextContent('First item');
	expect(itemsAfterMove[2]).toHaveTextContent('Nested item');

	expect(itemsAfterMove[1]).toContainElement(itemsAfterMove[2]);
});

test('Moves whole list up', async () => {
	const user = userEvent.setup();
	await renderRichEditor({ value: 'Green cup \n\n - First item \n\n - Second item' });

	const editor = screen.getByRole('textbox');
	const paragraph = within(editor).getByRole('paragraph');
	expect(paragraph).toHaveTextContent('Green cup');

	const list = within(editor).getByRole('list');
	expect(paragraph).toAppearBefore(list);

	const items = within(editor).getAllByRole('listitem');
	expect(items).toHaveLength(2);

	await user.click(items[0]);
	selectContent(editor, 'First item', 'Second item');
	await user.keyboard('{Alt>}{ArrowUp}{/Alt}');

	const paragraphAfterMove = within(editor).getByRole('paragraph');
	expect(paragraphAfterMove).toHaveTextContent('Green cup');

	const listAfterMove = within(editor).getByRole('list');
	expect(paragraphAfterMove).toAppearAfter(listAfterMove);

	const itemsAfterMove = within(editor).getAllByRole('listitem');
	expect(itemsAfterMove).toHaveLength(2);
	expect(itemsAfterMove[0]).toHaveTextContent('First item');
	expect(itemsAfterMove[1]).toHaveTextContent('Second item');
});

test('Does not move nested list items out of their parent list', async () => {
	const user = userEvent.setup();
	await renderRichEditor({
		value: `- Item one
	- Nested item
- Simple item`,
	});

	const editor = screen.getByRole('textbox');
	expect(within(editor).getAllByRole('list')).toHaveLength(2);

	const items = within(editor).getAllByRole('listitem');
	expect(items).toHaveLength(3);

	expect(items[0]).toHaveTextContent('Item one');
	expect(items[1]).toHaveTextContent('Nested item');
	expect(items[2]).toHaveTextContent('Simple item');

	await user.click(items[1]);
	setCursorPosition(items[1], 0);
	await user.keyboard('{Alt>}{ArrowDown}{/Alt}');

	// The move should be blocked to prevent breaking list structure
	const itemsAfterDown = within(editor).getAllByRole('listitem');
	expect(itemsAfterDown).toHaveLength(3);

	expect(itemsAfterDown[0]).toHaveTextContent('Item one');
	expect(itemsAfterDown[1]).toHaveTextContent('Nested item');
	expect(itemsAfterDown[2]).toHaveTextContent('Simple item');

	await user.click(items[1]);
	setCursorPosition(items[1], 0);
	await user.keyboard('{Alt>}{ArrowUp}{/Alt}');

	// List structure did not change
	const itemsAfterUp = within(editor).getAllByRole('listitem');
	expect(itemsAfterUp).toHaveLength(3);

	expect(itemsAfterUp[0]).toHaveTextContent('Item one');
	expect(itemsAfterUp[1]).toHaveTextContent('Nested item');
	expect(itemsAfterUp[2]).toHaveTextContent('Simple item');
});

test('Move nested blockquote', async () => {
	const user = userEvent.setup();
	await renderRichEditor({
		value: `> Main quote
>> Nested quote
>>
>> Again quote`,
	});

	const editor = screen.getByRole('textbox');
	const quotes = within(editor).getAllByRole('blockquote');
	expect(quotes).toHaveLength(2);

	const nestedQuote = within(quotes[1]).getAllByRole('paragraph');
	expect(nestedQuote).toHaveLength(2);
	expect(nestedQuote[0]).toHaveTextContent('Nested quote');
	expect(nestedQuote[1]).toHaveTextContent('Again quote');

	await user.click(nestedQuote[1]);
	selectContent(nestedQuote[1], 'Again quote');
	await user.keyboard('{Alt>}{ArrowUp}{/Alt}');

	// Nested quote paragraphs should be reordered
	const quotesAfterMove = within(editor).getAllByRole('blockquote');
	const nestedQuoteAfterMove = within(quotesAfterMove[1]).getAllByRole('paragraph');

	expect(nestedQuoteAfterMove).toHaveLength(2);
	expect(nestedQuoteAfterMove[0]).toHaveTextContent('Again quote');
	expect(nestedQuoteAfterMove[1]).toHaveTextContent('Nested quote');

	// Moving up again should have no effect
	await user.click(nestedQuote[1]);
	selectContent(nestedQuote[1], 'Again quote');
	await user.keyboard('{Alt>}{ArrowUp}{/Alt}');

	const quotesAfterNoop = within(editor).getAllByRole('blockquote');
	const nestedQuoteAfterNoop = within(quotesAfterNoop[1]).getAllByRole('paragraph');

	expect(nestedQuoteAfterNoop).toHaveLength(2);
	expect(nestedQuoteAfterNoop[0]).toHaveTextContent('Again quote');
	expect(nestedQuoteAfterNoop[1]).toHaveTextContent('Nested quote');
});

test('Moves selected heading and list together', async () => {
	const user = userEvent.setup();
	await renderRichEditor({
		value: `## Warning text \n\n - First item \n\n Another text`,
	});
	const editor = screen.getByRole('textbox');

	const heading = within(editor).getByRole('heading');
	expect(heading).toHaveTextContent('Warning text');

	const paragraph = within(editor).getByRole('paragraph');
	expect(paragraph).toHaveTextContent('Another text');

	const list = within(editor).getByRole('list');
	expect(list).toHaveTextContent('First item');

	expect(heading).toAppearBefore(list);
	expect(list).toAppearBefore(paragraph);

	// Select a few blocks
	await user.click(editor);
	selectContent(editor, 'Warning text', 'First item');
	await user.keyboard('{Alt>}{ArrowDown}{/Alt}');

	const headingAfterMove = within(editor).getByRole('heading');
	expect(headingAfterMove).toHaveTextContent('Warning text');

	const paragraphAfterMove = within(editor).getByRole('paragraph');
	expect(paragraphAfterMove).toHaveTextContent('Another text');

	const listAfterMove = within(editor).getByRole('list');
	expect(listAfterMove).toHaveTextContent('First item');

	expect(headingAfterMove).toAppearBefore(listAfterMove);
	expect(listAfterMove).toAppearAfter(paragraph);
});

test('Cannot move blocks beyond document boundaries', async () => {
	const user = userEvent.setup();
	await renderRichEditor({ value: 'Green cup \n\n Red cup' });

	const editor = screen.getByRole('textbox');
	const paragraphs = within(editor).getAllByRole('paragraph');

	await user.click(paragraphs[0]);
	setCursorPosition(paragraphs[0], 0);
	await user.keyboard('{Alt>}{ArrowUp}{/Alt}');

	const paragraphsAfterUp = within(editor).getAllByRole('paragraph');
	expect(paragraphsAfterUp[0]).toHaveTextContent('Green cup');
	expect(paragraphsAfterUp[1]).toHaveTextContent('Red cup');

	await user.click(paragraphs[1]);
	setCursorPosition(paragraphs[1], 0);
	await user.keyboard('{Alt>}{ArrowDown}{/Alt}');

	const paragraphsAfterDown = within(editor).getAllByRole('paragraph');
	expect(paragraphsAfterDown[0]).toHaveTextContent('Green cup');
	expect(paragraphsAfterDown[1]).toHaveTextContent('Red cup');
});
