import { useRef, useState } from 'react';

import { ButtonObject, ButtonsManager } from './ButtonsManager';

export type ButtonsManagerObject = {
	readonly controls: ButtonsManager;
	readonly state: {
		start: ButtonObject[];
		end: ButtonObject[];
	};
};

export const useButtonsManager = (): ButtonsManagerObject => {
	const [state, setState] = useState<ButtonsManagerObject['state']>({
		start: [],
		end: [],
	});

	const managerRef = useRef<ButtonsManager>(null as unknown as ButtonsManager);
	if (!managerRef.current) {
		managerRef.current = new ButtonsManager((buttons) => {
			requestAnimationFrame(() => {
				setState({
					start: buttons.start.map((button) => button.button),
					end: buttons.end.map((button) => button.button),
				});
			});
		});
	}

	return { state, controls: managerRef.current };
};
