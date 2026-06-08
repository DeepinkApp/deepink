import { useCallback, useMemo } from 'react';
import { toaster } from '@components/ui/toaster';

export const useStandaloneToast = (toastId: string) => {
	const close = useCallback(() => {
		toaster.dismiss(toastId);
	}, [toastId]);

	const show = useCallback(
		(options?: Parameters<typeof toaster.create>[0]) => {
			toaster.dismiss(toastId);
			requestAnimationFrame(() => {
				toaster.create({
					...options,
					id: toastId,
				});
			});
		},
		[toastId],
	);

	return useMemo(() => ({ close, show }), [close, show]);
};
