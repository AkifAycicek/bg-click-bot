import { vi } from 'vitest';
import { config } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';

// Register PrimeVue, ToastService, ConfirmationService globally
config.global.plugins = [PrimeVue, ToastService, ConfirmationService];
config.global.directives = {
    tooltip: { mounted: () => {}, updated: () => {} }
};

// Mock matchMedia (PrimeVue Select uses it)
window.matchMedia = window.matchMedia || vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
}));

// Mock window.electronAPI for all UI tests
window.electronAPI = {
    getWindows: vi.fn().mockResolvedValue([
        { hwnd: 1001, title: 'Game Client' },
        { hwnd: 1002, title: 'Notepad' },
        { hwnd: 1003, title: 'Game Client 2' }
    ]),
    capturePosition: vi.fn().mockResolvedValue({ x: 100, y: 200 }),
    startClicking: vi.fn().mockResolvedValue({ success: true }),
    stopClicking: vi.fn().mockResolvedValue({ success: true }),
    updatePoints: vi.fn().mockResolvedValue({ success: true }),
    onClickCountUpdate: vi.fn(),
    removeClickCountListener: vi.fn(),

    // Presets
    listPresets: vi.fn().mockResolvedValue([
        { id: 'farm-spot', name: 'Farm Spot', windowTitle: 'Game Client', pointCount: 2, updatedAt: '2026-03-22T12:00:00Z' },
        { id: 'boss-hunt', name: 'Boss Hunt', windowTitle: 'Game Client 2', pointCount: 1, updatedAt: '2026-03-22T13:00:00Z' }
    ]),
    loadPreset: vi.fn().mockResolvedValue({
        version: 1, name: 'Farm Spot', windowTitle: 'Game Client',
        points: [{ x: 100, y: 200, interval: 1000 }]
    }),
    savePreset: vi.fn().mockResolvedValue({ id: 'farm-spot' }),
    deletePreset: vi.fn().mockResolvedValue({ success: true }),
    renamePreset: vi.fn().mockResolvedValue({ id: 'new-name' }),
    duplicatePreset: vi.fn().mockResolvedValue({ id: 'copy' }),
    exportPreset: vi.fn().mockResolvedValue({ path: '/tmp/test.json' }),
    importPreset: vi.fn().mockResolvedValue({ id: 'imported', name: 'Imported' }),

    // Settings
    loadSettings: vi.fn().mockResolvedValue({ darkMode: false, autoSave: false, lastPresetId: null }),
    saveSettings: vi.fn().mockResolvedValue({ success: true })
};
