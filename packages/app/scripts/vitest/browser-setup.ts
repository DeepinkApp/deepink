vi.mock('electron');
vi.mock('@electron/requests/interop/renderer', () => ({ setAppLanguage: () => {} }));
