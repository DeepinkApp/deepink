import { ContextMenu } from '@electron/requests/contextMenu';

import { createFakeContextMenu } from './mocks';

// TODO: cover events usage
describe('Item selection', () => {
	const menuItemsSample = [
		{ id: 'foo', label: 'foo', click: vi.fn() },
		{ id: 'bar', label: 'bar' },
		{ label: 'UNLISTED' },
		{ id: 'baz', label: 'baz', click: vi.fn() },
	] as const satisfies ContextMenu;

	beforeEach(() => {
		vi.resetAllMocks();
	});

	test('Promise resolves with null when nothing selected', async () => {
		const { menu, selector } = createFakeContextMenu();

		selector.mockImplementation(async () => null);
		await expect(menu.open(menuItemsSample, { x: 0, y: 0 })).resolves.toBe(null);
	});

	test('Menu item can be selected by id', async () => {
		const { menu, selector } = createFakeContextMenu();

		const clickTarget = menuItemsSample[1];

		selector.mockImplementation(async () => clickTarget.id);
		await expect(menu.open(menuItemsSample, { x: 0, y: 0 })).resolves.toStrictEqual({
			id: clickTarget.id,
			menuItem: clickTarget,
		});
	});

	test('Item callback must be called for selected item', async () => {
		const { menu, selector } = createFakeContextMenu();

		const clickTarget = menuItemsSample[0];
		expect(clickTarget.click).toHaveBeenCalledTimes(0);

		selector.mockImplementation(async () => clickTarget.id);
		await expect(menu.open(menuItemsSample, { x: 0, y: 0 })).resolves.toStrictEqual({
			id: clickTarget.id,
			menuItem: clickTarget,
		});
		expect(clickTarget.click).toHaveBeenCalledTimes(1);
	});
});

describe('Mocks', () => {
	test('Promise resolves when nothing selected', async () => {
		const { menu, selector } = createFakeContextMenu();

		selector.mockImplementation(async () => null);
		expect(selector).toHaveBeenCalledTimes(0);

		await expect(menu.open([], { x: 0, y: 0 })).resolves.toBe(null);
		expect(selector).toHaveBeenCalledTimes(1);
		expect(selector).toHaveBeenLastCalledWith({
			menu: [],
			position: { x: 0, y: 0 },
			itemsMap: expect.toSatisfy((value: Map<any, any>) => {
				expect(value).toBeInstanceOf(Map);
				expect(value.size).toBe(0);
				return true;
			}),
		});
	});

	test('Selector receives items map with only items with id', async () => {
		const { menu, selector } = createFakeContextMenu();

		selector.mockImplementation(async () => null);
		expect(selector).toHaveBeenCalledTimes(0);

		const menuItems: ContextMenu = [
			{ id: 'foo', label: 'foo', click: () => {} },
			{ id: 'bar', label: 'bar' },
			{ label: 'UNLISTED' },
			{ id: 'baz', label: 'baz', click: () => {} },
		];

		await expect(menu.open(menuItems, { x: 0, y: 0 })).resolves.toBe(null);
		expect(selector).toHaveBeenCalledTimes(1);
		expect(selector).toHaveBeenLastCalledWith({
			position: { x: 0, y: 0 },
			menu: expect.toSatisfy((value) => {
				expect(value, 'Expected a modified object transferred via IPC').not.toBe(
					menuItems,
				);

				expect(value).toStrictEqual([
					expect.objectContaining({ id: 'foo' }),
					expect.objectContaining({ id: 'bar' }),
					expect.objectContaining({ label: 'UNLISTED' }),
					expect.objectContaining({ id: 'baz' }),
				]);

				return true;
			}),
			itemsMap: expect.toSatisfy((value: Map<any, any>) => {
				expect(value).toBeInstanceOf(Map);
				expect(Array.from(value.keys())).toEqual(
					expect.arrayContaining(['foo', 'bar', 'baz']),
				);
				expect(value.size).toBe(3);
				return true;
			}),
		});
	});
});
