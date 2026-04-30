import { roundTo } from './math';

test('Round floats', () => {
	const number = 71.10545955034506;

	expect(roundTo(number, 0)).toBe(71);
	expect(roundTo(number, 1)).toBe(71.1);
	expect(roundTo(number, 2)).toBe(71.11);
	expect(roundTo(number, 3)).toBe(71.105);
});
