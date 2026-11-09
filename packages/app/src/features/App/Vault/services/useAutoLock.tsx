import { useEffect } from 'react';
import ms from 'ms';
import { onLockScreenChanged } from '@electron/requests/screenLock/renderer';
import { useAppSelector } from '@state/redux/hooks';
import { selectVaultLockConfig } from '@state/redux/settings/selectors/preferences';

import { useVaultControls } from '../useVaultControls';

export const useAutoLock = () => {
	const {
		close: closeVault,
		vault: {
			vault: { isEncrypted },
		},
	} = useVaultControls();
	const { lockAfterIdle, lockOnSystemLock } = useAppSelector(selectVaultLockConfig);

	// Lock when device is locked
	useEffect(() => {
		if (!isEncrypted || !lockOnSystemLock) return;

		console.debug('Auto lock for vault by screen lock is enabled');
		return onLockScreenChanged((status) => {
			if (status !== 'locked') return;

			console.debug('Device is locked. Lock vault...');
			closeVault();
		});
	}, [closeVault, isEncrypted, lockOnSystemLock]);

	// Lock after idle
	useEffect(() => {
		if (!isEncrypted || !lockAfterIdle) return;

		if (lockAfterIdle < ms('1m') || lockAfterIdle > ms('48h')) {
			console.warn(
				'Auto lock by timeout is force disabled because idle time have no sense',
				lockAfterIdle,
			);
			return;
		}

		console.debug(
			`Auto lock by idle time is enabled. Vault will be locked after ${ms(lockAfterIdle)} inactivity`,
		);

		let lockTimer: number | null = null;
		const markActive = (): void => {
			if (lockTimer !== null) {
				window.clearTimeout(lockTimer);
			}

			lockTimer = window.setTimeout(closeVault, lockAfterIdle);
		};

		const events: (keyof DocumentEventMap)[] = [
			'keydown',
			'keyup',
			'pointerdown',
			'pointermove',
			'pointerup',
			'wheel',
			'focus',
			'visibilitychange',
		];

		for (const event of events) {
			document.addEventListener(event, markActive, { passive: true });
		}

		markActive();

		return (): void => {
			if (lockTimer !== null) {
				window.clearTimeout(lockTimer);
			}

			for (const event of events) {
				document.removeEventListener(event, markActive);
			}
		};
	}, [closeVault, isEncrypted, lockAfterIdle]);
};
