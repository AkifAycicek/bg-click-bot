import { vi } from 'vitest';

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
        { hwnd: 1001, title: 'SRO_Client' },
        { hwnd: 1002, title: 'Notepad' },
        { hwnd: 1003, title: 'SRO_Client 2' }
    ]),
    capturePosition: vi.fn().mockResolvedValue({ x: 100, y: 200 }),
    startClicking: vi.fn().mockResolvedValue({ success: true }),
    stopClicking: vi.fn().mockResolvedValue({ success: true }),
    updatePoints: vi.fn().mockResolvedValue({ success: true }),
    onClickCountUpdate: vi.fn(),
    removeClickCountListener: vi.fn()
};
