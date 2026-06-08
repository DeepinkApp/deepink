import React, {
	createContext,
	FC,
	PropsWithChildren,
	ReactNode,
	useCallback,
	useEffect,
	useState,
} from 'react';
import { createEvent, EventCallable } from 'effector';
import { Dialog } from '@chakra-ui/react';
import { WorkspaceModal } from '@features/WorkspaceModal';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

export type ModalWindowApi = { onClose: () => void };

export type ModalPayload = {
	onClose?: () => void;
	content: (props: ModalWindowApi) => ReactNode;
};

const modalContext = createContext<{
	show: EventCallable<ModalPayload>;
}>(null as any);
export const useWorkspaceModal = createContextGetterHook(modalContext);

const modalApiContext = createContext<ModalWindowApi>(null as any);
export const useModalApi = createContextGetterHook(modalApiContext);

export type WorkspaceModalProviderProps = PropsWithChildren<{
	isVisible?: boolean;
}>;

export const WorkspaceModalProvider: FC<WorkspaceModalProviderProps> = ({
	isVisible = true,
	children,
}) => {
	const [context] = useState(() => ({
		show: createEvent<ModalPayload>(),
	}));

	const [modals, setModals] = useState<ModalPayload[]>([]);

	const modal = (modals[0] ?? null) as ModalPayload | null;
	const onClose = useCallback(() => {
		if (!modal) return;

		if (modal.onClose) {
			modal.onClose();
		}

		setModals(([_payload, ...payloads]) => [...payloads]);
	}, [modal]);

	useEffect(() => {
		const { show } = context;

		const cleanups = [
			show.watch((payload) => {
				setModals((payloads) => [payload, ...payloads]);
			}),
		];

		return () => {
			cleanups.forEach((cleanup) => cleanup());
		};
	});

	const api = { onClose };

	return (
		<modalContext.Provider value={context}>
			{children}
			{modal && (
				<WorkspaceModal
					open={isVisible}
					placement="center"
					onOpenChange={(e) => {
						if (!e.open) onClose();
					}}
				>
					<Dialog.Backdrop />
					<modalApiContext.Provider value={api}>
						<Dialog.Positioner>
							<Dialog.Content>{modal.content(api)}</Dialog.Content>
						</Dialog.Positioner>
					</modalApiContext.Provider>
				</WorkspaceModal>
			)}
		</modalContext.Provider>
	);
};
