/* eslint-disable @cspell/spellchecker */
import { buildDictionary, calcEntropy } from './calculatePasswordEntropy';

enum ENTROPY_LEVEL {
	poor = 10,
	low = 30,
	medium = 50,
	fine = 60,
	great = 80,
	excellent = 100,
}

test('Passwords with repeated chars are weak', () => {
	expect(calcEntropy('a').entropy).toBeLessThan(ENTROPY_LEVEL.poor);

	expect(calcEntropy('a'.repeat(100)).entropy).toBe(0);
	expect(calcEntropy('aaa').entropy).toBe(0);

	expect(calcEntropy('faaaaaa').entropy).toBeLessThan(ENTROPY_LEVEL.poor);
	expect(calcEntropy('sdfgffffffffffffffffffffffff').entropy).toBeLessThan(
		ENTROPY_LEVEL.low,
	);
});

test('Random passwords have strong entropy', () => {
	expect(calcEntropy('e"&BKy#+[~D5').entropy).toBeGreaterThan(ENTROPY_LEVEL.fine);
	expect(calcEntropy('X^f2pf5r9wpOdKWj').entropy).toBeGreaterThan(ENTROPY_LEVEL.great);
	expect(calcEntropy('Ny¾qÝ§gsÿÍ!bN=').entropy).toBeGreaterThan(
		ENTROPY_LEVEL.excellent,
	);
});

test('Dictionary passwords are weak', () => {
	expect(
		calcEntropy('BananaEatMonkey', buildDictionary(['banana', 'monkey', 'eat']))
			.entropy,
	).toBeLessThan(ENTROPY_LEVEL.poor);

	expect(
		calcEntropy('БананЕстОбезьяну', buildDictionary(['банан', 'ест', 'обезьян']))
			.entropy,
	).toBeLessThan(ENTROPY_LEVEL.low);
});
