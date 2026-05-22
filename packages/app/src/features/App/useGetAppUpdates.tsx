import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ms from 'ms';
import { getAbout } from 'src/about';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { toaster } from '@components/ui/toaster';
import { AppUpdatesChecker, AppVersionInfo } from '@electron/updates/AppUpdatesChecker';
import { getDevFlag } from '@utils/dev';

const toastId = 'newVersion';

export const useGetAppUpdates = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);
	const ignoreFlagKey = 'ignoreUpdate';

	const ignoreUpdate = useCallback(() => {
		localStorage.setItem(ignoreFlagKey, String(new Date()));

		toaster.dismiss(toastId);
		toaster.create({
			id: toastId,
			title: t('updates.appUpdate.title'),
			description: t('updates.appUpdate.reminderLater'),
		});
	}, [t]);

	return useCallback(
		async (forceCheck = false) => {
			// Ignore update if user decline
			const ignoreTime = localStorage.getItem(ignoreFlagKey);
			if (!forceCheck && ignoreTime) {
				try {
					const ignoreTimestamp = new Date(ignoreTime).getTime();
					const timeDelta = Date.now() - ignoreTimestamp;

					if (timeDelta < ms('7 days')) return null;
				} catch (error) {
					console.error(error);
					localStorage.removeItem(ignoreFlagKey);
				}
			}

			const appReleases = new AppUpdatesChecker({ host: 'https://deepink.app' });

			console.log('TODO: use ignoreUpdate', ignoreUpdate);

			return appReleases
				.getUpdate({
					version: getDevFlag('version') ?? getAbout().version,
				})
				.then((newVersion) => {
					if (!newVersion) return null;

					const updateUrl = 'https://deepink.app/download';

					toaster.dismiss(toastId);
					toaster.create({
						id: toastId,
						title: t('updates.newVersion.title'),
						description: t('updates.newVersion.body'),
						duration: undefined,
						action: {
							label: t('updates.newVersion.download'),
							onClick: () => {
								window.open(updateUrl);
								localStorage.removeItem(ignoreFlagKey);
								toaster.dismiss(toastId);
							},
						},
					});

					return {
						version: newVersion.version,
						url: updateUrl,
					} satisfies AppVersionInfo;
				});
		},
		[ignoreUpdate, t],
	);
};
