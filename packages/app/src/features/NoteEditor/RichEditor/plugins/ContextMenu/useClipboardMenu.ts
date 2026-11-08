import { useCallback } from 'react';

import { ContextMenuBuilder } from './types';

export const useClipboardMenu = (): ContextMenuBuilder =>
	useCallback<ContextMenuBuilder>((_context) => {
		const isTextSelected = _context.selectedText.length > 0;
		return [
			{ type: 'separator' },
			{
				label: 'Cut',
				role: 'cut',
				enabled: isTextSelected,
			},
			{
				label: 'Copy',
				role: 'copy',
				enabled: isTextSelected,
			},
			{ label: 'Paste', role: 'paste' },
			{ label: 'Select all', role: 'selectAll' },
		];
	}, []);
