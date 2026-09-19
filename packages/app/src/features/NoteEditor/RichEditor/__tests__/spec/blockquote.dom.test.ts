import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderRichEditor } from '../utils/renderRichEditor';
import { selectContent, setCursorPosition } from '../utils/utils';

test('Creates and removes quote', async () => {
	const user = userEvent.setup();
	const richEditor = await renderRichEditor({ value: 'One \n\n cat' });

	const editor = screen.getByRole('textbox');
	selectContent(editor, 'cat');
	await richEditor.insert({ type: 'quote' });

	expect(within(editor).getByRole('blockquote')).toHaveTextContent('cat');

	// Set the cursor position at the start of the text
	const quote = within(editor).getByRole('blockquote');
	await user.click(quote);
	setCursorPosition(quote, 0);
	await user.keyboard('{Backspace}');

	expect(within(editor).queryByRole('blockquote')).not.toBeInTheDocument();
	expect(editor).toHaveTextContent('One');
	expect(editor).toHaveTextContent('cat');
});

test('Removes an empty quote', async () => {
	const user = userEvent.setup();
	await renderRichEditor({ value: '>' });

	const editor = screen.getByRole('textbox');
	const quote = within(editor).getByRole('blockquote');
	expect(quote).toHaveTextContent('');

	await user.click(quote);
	await user.keyboard('{Backspace}');

	expect(within(editor).queryByRole('blockquote')).not.toBeInTheDocument();
});

test('Removes quote after deleting its text', async () => {
	const user = userEvent.setup();
	await renderRichEditor({ value: '> text' });

	const editor = screen.getByRole('textbox');
	const quote = within(editor).getByRole('blockquote');
	expect(quote).toHaveTextContent('text');

	// Select the text for deletion
	await user.click(quote);
	selectContent(quote, 'text');

	// The first press deletes the text; the second press removes the quote
	await user.keyboard('{Backspace}');
	expect(within(editor).queryByText('text')).not.toBeInTheDocument();
	expect(within(editor).getByRole('blockquote')).toHaveTextContent('');

	await user.keyboard('{Backspace}');
	expect(within(editor).queryByRole('blockquote')).not.toBeInTheDocument();
});

test('Removes nested quote after deleting its text', async () => {
	const user = userEvent.setup();
	await renderRichEditor({ value: `> foo\n>> bar` });

	const editor = screen.getByRole('textbox');
	const quotes = within(editor).getAllByRole('blockquote');
	expect(quotes).toHaveLength(2);
	expect(quotes[0]).toContainElement(quotes[1]);
	expect(quotes[0]).toHaveTextContent('foo');
	expect(quotes[1]).toHaveTextContent('bar');

	// Delete the text
	await user.click(quotes[1]);
	selectContent(quotes[1], 'bar');
	await user.keyboard('{Backspace}');

	const updatedQuotes = within(editor).getAllByRole('blockquote');
	expect(updatedQuotes).toHaveLength(2);
	expect(updatedQuotes[1]).toHaveTextContent('');

	// The second press should remove the nested quote
	await user.keyboard('{Backspace}');
	const finalQuotes = within(editor).getAllByRole('blockquote');
	expect(finalQuotes).toHaveLength(1);
	expect(finalQuotes[0]).toHaveTextContent('foo');
});

test('Reduces quote nesting level while preserving its text', async () => {
	const user = userEvent.setup();
	await renderRichEditor({ value: `> foo\n>> bar` });

	const editor = screen.getByRole('textbox');
	const quotes = within(editor).getAllByRole('blockquote');
	expect(quotes).toHaveLength(2);
	expect(quotes[0]).toContainElement(quotes[1]);

	// Set the cursor position at the start of the text
	await user.click(quotes[1]);
	setCursorPosition(quotes[1], 0);
	await user.keyboard('{Backspace}');

	const updatedQuote = within(editor).getAllByRole('blockquote');
	expect(updatedQuote).toHaveLength(1);
	expect(updatedQuote[0]).toHaveTextContent('foo');
	expect(updatedQuote[0]).toHaveTextContent('bar');
});

test('Removes one quote nesting level at a time', async () => {
	const user = userEvent.setup();
	await renderRichEditor({ value: '>>>' });

	const editor = screen.getByRole('textbox');
	const quotes = within(editor).getAllByRole('blockquote');
	expect(quotes).toHaveLength(3);
	expect(quotes[0]).toContainElement(quotes[1]);
	expect(quotes[1]).toContainElement(quotes[2]);

	await user.click(quotes[2]);
	await user.keyboard('{Backspace}');
	expect(within(editor).getAllByRole('blockquote')).toHaveLength(2);

	await user.keyboard('{Backspace}');
	expect(within(editor).queryAllByRole('blockquote')).toHaveLength(1);

	await user.keyboard('{Backspace}');
	expect(within(editor).queryAllByRole('blockquote')).toHaveLength(0);
});
