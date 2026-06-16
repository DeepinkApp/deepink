import React, { FC, useCallback, useEffect, useState } from 'react';
import { $getNearestNodeFromDOMNode, LexicalEditor, LexicalNode } from 'lexical';
import { BoxProps, Portal } from '@chakra-ui/react';
import { Popper } from '@components/Popper';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';

export type ContextMenuRendererProps = {
	node: LexicalNode;
	element: Element;
	editor: LexicalEditor;
	close: () => void;
};

export type ContextMenuProps = BoxProps & {
	renderer: FC<ContextMenuRendererProps>;
};

export const ContextMenuPlugin = ({
	renderer: RendererComponent,
	...props
}: ContextMenuProps) => {
	const [editor] = useLexicalComposerContext();
	const rootElement = editor.getRootElement();

	const [menuContext, setMenuContext] = useState<{
		node: LexicalNode;
		element: HTMLElement;
	} | null>(null);

	const close = useCallback(() => {
		setMenuContext(null);
	}, []);

	// Trigger context menu
	useEffect(() => {
		if (!rootElement) return;

		const onContextMenu = (evt: MouseEvent) => {
			editor.read(() => {
				const target = evt.target as HTMLElement;

				const lexicalNode = $getNearestNodeFromDOMNode(target);
				if (!lexicalNode) return;

				const rootElement = editor.getElementByKey(lexicalNode.getKey());
				if (!rootElement) return;

				evt.preventDefault();
				setMenuContext({
					node: lexicalNode,
					element: rootElement,
				});
			});
		};

		rootElement.addEventListener('contextmenu', onContextMenu);
		return () => {
			rootElement.removeEventListener('contextmenu', onContextMenu);
		};
	}, [editor, rootElement, setMenuContext]);

	// Maintain context data
	useEffect(() => {
		if (!menuContext) return;

		const currentNode = menuContext.node;
		const currentElement = menuContext.element;
		return mergeRegister(
			// Close context menu by remove node from tree
			editor.registerUpdateListener(() => {
				const isAttached = editor.read(() => currentNode.isAttached());
				if (!isAttached) {
					close();
				}
			}),
			// Update DOM element in current context, bu changes in Lexical node
			editor.registerUpdateListener((_node) => {
				const newElement = editor.getElementByKey(menuContext.node.getKey());
				if (!newElement) {
					close();
					return;
				}

				if (newElement === currentElement) return;

				setMenuContext({
					...menuContext,
					element: newElement,
				});
			}),
		);
	}, [close, editor, menuContext]);

	const children = menuContext ? (
		<RendererComponent {...{ ...menuContext, editor, close }} />
	) : null;

	return children ? (
		<Portal>
			<Popper referenceRef={menuContext?.element} onClose={close} {...props}>
				{children}
			</Popper>
		</Portal>
	) : null;
};
