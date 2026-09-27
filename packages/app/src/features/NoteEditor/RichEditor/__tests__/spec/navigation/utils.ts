import { act } from 'react';
import { userEvent } from 'vitest/browser';

export const moveSelection = async (direction: 'up' | 'down') => {
	await act(async () => {
		await userEvent.keyboard(
			direction === 'up' ? '{Alt>}{ArrowUp}{/Alt}' : '{Alt>}{ArrowDown}{/Alt}',
		);
	});
};

export const expectMarkdown = async (
	onChanged: ReturnType<typeof vi.fn>,
	lines: string[],
) => {
	await expect.poll(() => onChanged).toHaveBeenLastCalledWith(`${lines.join('\n')}\n`);
};
