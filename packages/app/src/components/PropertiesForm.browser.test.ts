import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { createInstance } from 'i18next';
import { page, userEvent } from 'vitest/browser';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { OptionObject, PropertiesForm } from '@components/PropertiesForm';

const renderForm = async (options: OptionObject[]) => {
	const i18n = createInstance();
	await i18n.use(initReactI18next).init({
		lng: 'en',
		fallbackLng: 'en',
		ns: ['common'],
		defaultNS: 'common',
		resources: {
			en: {
				common: {
					actions: {
						saveChanges: 'Save changes',
						cancel: 'Cancel',
					},
					form: {
						suggestTemplate: 'Try this: <suggests>',
					},
				},
			},
		},
		interpolation: { escapeValue: false },
		react: { useSuspense: false },
	});

	const container = document.createElement('div');
	document.body.appendChild(container);
	const root = createRoot(container);
	await act(async () => {
		root.render(
			React.createElement(
				ChakraProvider,
				// @ts-expect-error we should pass component as a separate parameter
				{ value: defaultSystem },
				React.createElement(
					I18nextProvider,
					{ i18n },
					React.createElement(PropertiesForm, {
						options,
						onUpdate: () => undefined,
					}),
				),
			),
		);
	});

	onTestFinished(() => {
		act(() => root.unmount());
		container.remove();
	});
};

test('async suggestions are debounced and only the latest response is shown', async () => {
	const pendingResponses = new Map<string, (suggestions: string[]) => void>();
	const loadSuggestions = vi.fn(
		(query: string) =>
			new Promise<string[]>((resolve) => {
				pendingResponses.set(query, resolve);
			}),
	);

	await renderForm([
		{
			id: 'name',
			value: '',
			label: 'Name',
			suggests: loadSuggestions,
		},
	]);

	const input = page.getByRole('textbox');
	await userEvent.fill(input, 'intermediate');
	await userEvent.fill(input, 'old query');
	await expect
		.poll(() => loadSuggestions.mock.calls.map(([query]) => query))
		.toEqual(['old query']);

	await userEvent.fill(input, 'latest query');
	await expect
		.poll(() => loadSuggestions.mock.calls.map(([query]) => query))
		.toEqual(['old query', 'latest query']);

	await act(async () => pendingResponses.get('latest query')?.(['latest result']));
	const latestSuggestion = page.getByRole('button', { name: 'latest result' });
	await expect.element(latestSuggestion).toBeVisible();

	await act(async () => pendingResponses.get('old query')?.(['stale result']));
	expect(page.getByRole('button', { name: 'stale result' })).not.toBeInTheDocument();
	await expect.element(latestSuggestion).toBeVisible();
});

test('static suggestions remain visible', async () => {
	await renderForm([
		{
			id: 'name',
			value: '',
			label: 'Name',
			suggests: ['Static suggestion'],
		},
	]);

	await expect
		.element(page.getByRole('button', { name: 'Static suggestion' }))
		.toBeVisible();
});
