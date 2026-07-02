export const createSyncContext = <T>(defaultValue: T) => {
	let context: { current: T } | null = null;

	const get = () => (context ? context.current : defaultValue);
	const use = <R = void>(value: T, callback: () => R) => {
		// Set context
		const currentContext = context;
		context = { current: value };
		try {
			return callback();
		} finally {
			// Restore previous context
			context = currentContext;
		}
	};

	return { get, use };
};
