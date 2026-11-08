import { $setSelection } from 'lexical';

import { ContextMenuContext } from './types';

export const $restoreContextMenuSelection = (context: ContextMenuContext) => {
	if (context.selection) $setSelection(context.selection.clone());
};
