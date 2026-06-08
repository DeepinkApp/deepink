export const basicComparator = <T>(a: T, b: T) => {
	if (typeof a === 'string' && typeof b === 'string') {
		const result = a.localeCompare(b);
		if (result !== 0) return result;
	}

	if (a > b) return 1;
	if (a < b) return -1;
	return 0;
};

export const orderBy = <I, O>(
	selector: (value: I) => O[],
	comparator: (a: O, b: O) => number = basicComparator,
) => {
	return (a: I, b: I) => {
		const set1 = selector(a);
		const set2 = selector(b);
		if (set1.length !== set2.length)
			throw new RangeError('The length of tuples to compare is not equal');

		for (let i = 0; i < set1.length; i++) {
			const a = set1[i];
			const b = set2[i];

			const result = comparator(a, b);
			if (result !== 0) return result;
		}

		return 0;
	};
};
