import type { Plausible } from 'plausible-client';

export function enableTrackKeyboardUsers(plausible: Plausible) {
	const onKeyDown = (evt: KeyboardEvent) => {
		let key;
		switch (evt.key) {
			case 'Enter':
			case 'Tab':
			case 'ArrowUp':
			case 'ArrowDown':
			case 'ArrowLeft':
			case 'ArrowRight':
			case 'Home':
			case 'End':
			case 'PageUp':
			case 'PageDown':
				key = evt.key;
				break;

			// Special cases
			case ' ':
				key = 'Space';
				break;

			// Return for any other keys
			default:
				return;
		}

		plausible.trackEvent('Keyboard navigation', { props: { key } });
	};

	document.addEventListener('keydown', onKeyDown);
	return () => {
		document.removeEventListener('keydown', onKeyDown);
	};
}
