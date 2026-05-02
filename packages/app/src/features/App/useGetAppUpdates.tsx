import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ms from 'ms';
import { getAbout } from 'src/about';
import { LOCALE_NAMESPACE } from 'src/i18n';
import { Button, useToast, UseToastOptions } from '@chakra-ui/react';
import { AppToast } from '@components/AppToast';
import { AppUpdatesChecker, AppVersionInfo } from '@electron/updates/AppUpdatesChecker';
import { getDevFlag } from '@utils/dev';

export const useGetAppUpdates = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.features);
	const ignoreFlagKey = 'ignoreUpdate';

	const toast = useToast();
	const showToast = useCallback(
		(options?: UseToastOptions) => {
			const toastId = 'newVersion';

			toast.close(toastId);
			requestAnimationFrame(() => {
				toast({
					...options,
					id: toastId,
				});
			});
		},
		[toast],
	);

	const ignoreUpdate = useCallback(() => {
		localStorage.setItem(ignoreFlagKey, String(new Date()));

		showToast({
			position: 'top-right',
			containerStyle: {
				maxW: '350px',
			},
			render() {
				return (
					<AppToast
						title={t('updates.appUpdate.title')}
						body={t('updates.appUpdate.reminderLater')}
					/>
				);
			},
		});
	}, [showToast, t]);

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

			return appReleases
				.getUpdate({
					version: getDevFlag('version') ?? getAbout().version,
				})
				.then((newVersion) => {
					if (!newVersion) return null;

					const updateUrl = 'https://deepink.app/download';

					showToast({
						duration: null,
						position: 'top-right',
						containerStyle: {
							maxW: '350px',
						},
						render(props) {
							return (
								<AppToast
									title={t('updates.newVersion.title')}
									body={t('updates.newVersion.body')}
									actions={
										<>
											<Button
												size="sm"
												variant="accent"
												onClick={() => {
													window.open(updateUrl);
													localStorage.removeItem(
														ignoreFlagKey,
													);
													props.onClose();
												}}
											>
												{t('updates.newVersion.download')}
											</Button>
											<Button
												size="sm"
												onClick={() => {
													props.onClose();
													ignoreUpdate();
												}}
											>
												{t('updates.newVersion.ignore')}
											</Button>
										</>
									}
								/>
							);
						},
					});

					return {
						version: newVersion.version,
						url: updateUrl,
					} satisfies AppVersionInfo;
				});
		},
		[ignoreUpdate, showToast, t],
	);
};
