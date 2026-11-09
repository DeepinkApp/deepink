import type { ContextMenu } from '@electron/requests/contextMenu';

import { normalizeMenu } from './normalizeMenu';

test('removes leading, trailing, and repeated separators', () => {
	const menu: ContextMenu = [
		{ type: 'separator' },
		{ label: 'Edit' },
		{ type: 'separator' },
		{ type: 'separator' },
		{ label: 'Copy', role: 'copy' },
		{ type: 'separator' },
	];

	expect(normalizeMenu(menu)).toEqual([
		{ label: 'Edit' },
		{ type: 'separator' },
		{ label: 'Copy', role: 'copy' },
	]);
});

test('normalizes separators independently at every submenu level', () => {
	const menu: ContextMenu = [
		{
			label: 'Actions',
			submenu: [
				{ type: 'separator' },
				{ label: 'Edit' },
				{ type: 'separator' },
				{ type: 'separator' },
				{
					label: 'More',
					submenu: [
						{ type: 'separator' },
						{ type: 'separator' },
						{ label: 'Copy', role: 'copy' },
						{ type: 'separator' },
					],
				},
				{ type: 'separator' },
			],
		},
		{ type: 'separator' },
		{ type: 'separator' },
		{ label: 'Select all', role: 'selectAll' },
	];

	expect(normalizeMenu(menu)).toEqual([
		{
			label: 'Actions',
			submenu: [
				{ label: 'Edit' },
				{ type: 'separator' },
				{
					label: 'More',
					submenu: [{ label: 'Copy', role: 'copy' }],
				},
			],
		},
		{ type: 'separator' },
		{ label: 'Select all', role: 'selectAll' },
	]);
});

test('preserves item properties and callbacks without mutating the input', () => {
	const click = vi.fn();
	const menu: ContextMenu = [
		{
			label: 'Actions',
			submenu: [
				{ type: 'separator' },
				{ label: 'Edit', enabled: false, click },
				{ type: 'separator' },
			],
		},
	];

	const normalized = normalizeMenu(menu);

	expect(normalized).toEqual([
		{
			label: 'Actions',
			submenu: [{ label: 'Edit', enabled: false, click }],
		},
	]);
	expect(normalized).not.toBe(menu);
	expect(normalized[0]).not.toBe(menu[0]);
	expect(normalized[0].submenu).not.toBe(menu[0].submenu);
	expect(menu[0].submenu).toEqual([
		{ type: 'separator' },
		{ label: 'Edit', enabled: false, click },
		{ type: 'separator' },
	]);
});

test('returns an empty menu when it contains no actionable items', () => {
	expect(normalizeMenu([])).toEqual([]);
	expect(normalizeMenu([{ type: 'separator' }, { type: 'separator' }])).toEqual([]);
});
