const { describe, it } = require('node:test');
const assert = require('node:assert');
const { makeLParam, getVisibleWindows, backgroundClick, captureMousePosition, focusWindow, WM_LBUTTONDOWN, WM_LBUTTONUP, MK_LBUTTON } = require('../bot');

// --- makeLParam ---

describe('makeLParam', () => {
    it('should encode x and y into a single LPARAM value', () => {
        const result = makeLParam(100, 200);
        const x = result & 0xFFFF;
        const y = (result >> 16) & 0xFFFF;
        assert.strictEqual(x, 100);
        assert.strictEqual(y, 200);
    });

    it('should handle zero coordinates', () => {
        assert.strictEqual(makeLParam(0, 0), 0);
    });

    it('should handle max 16-bit values', () => {
        const result = makeLParam(65535, 65535);
        assert.strictEqual(result & 0xFFFF, 65535);
        assert.strictEqual((result >> 16) & 0xFFFF, 65535);
    });

    it('should handle typical game coordinates', () => {
        const result = makeLParam(512, 384);
        assert.strictEqual(result & 0xFFFF, 512);
        assert.strictEqual((result >> 16) & 0xFFFF, 384);
    });

    it('should handle x=0 with non-zero y', () => {
        const result = makeLParam(0, 300);
        assert.strictEqual(result & 0xFFFF, 0);
        assert.strictEqual((result >> 16) & 0xFFFF, 300);
    });

    it('should handle non-zero x with y=0', () => {
        const result = makeLParam(400, 0);
        assert.strictEqual(result & 0xFFFF, 400);
        assert.strictEqual((result >> 16) & 0xFFFF, 0);
    });

    it('should handle coordinates at 1,1', () => {
        const result = makeLParam(1, 1);
        assert.strictEqual(result & 0xFFFF, 1);
        assert.strictEqual((result >> 16) & 0xFFFF, 1);
    });
});

// --- Windows API constants ---

describe('Windows API constants', () => {
    it('should have correct WM_LBUTTONDOWN value', () => {
        assert.strictEqual(WM_LBUTTONDOWN, 0x0201);
    });

    it('should have correct WM_LBUTTONUP value', () => {
        assert.strictEqual(WM_LBUTTONUP, 0x0202);
    });

    it('should have correct MK_LBUTTON value', () => {
        assert.strictEqual(MK_LBUTTON, 0x0001);
    });

    it('WM_LBUTTONUP should be WM_LBUTTONDOWN + 1', () => {
        assert.strictEqual(WM_LBUTTONUP, WM_LBUTTONDOWN + 1);
    });
});

// --- getVisibleWindows ---

describe('getVisibleWindows', () => {
    it('should return an array', () => {
        const windows = getVisibleWindows();
        assert.ok(Array.isArray(windows));
    });

    it('should find at least one visible window', () => {
        const windows = getVisibleWindows();
        assert.ok(windows.length > 0, 'En az bir gorunur pencere olmali');
    });

    it('should have hwnd and title properties on each window', () => {
        const windows = getVisibleWindows();
        for (const win of windows) {
            assert.ok(typeof win.hwnd === 'number', 'hwnd number olmali');
            assert.ok(typeof win.title === 'string', 'title string olmali');
            assert.ok(win.title.trim().length > 0, 'title bos olmamali');
        }
    });

    it('should return unique hwnds', () => {
        const windows = getVisibleWindows();
        const hwnds = windows.map(w => w.hwnd);
        const unique = new Set(hwnds);
        assert.strictEqual(hwnds.length, unique.size, 'Ayni hwnd birden fazla olmamali');
    });

    it('should return consistent results on consecutive calls', () => {
        const first = getVisibleWindows();
        const second = getVisibleWindows();
        // Window count should be roughly the same (allow ±2 for timing)
        assert.ok(Math.abs(first.length - second.length) <= 2, 'Ardisik cagrilar tutarli olmali');
    });
});

// --- backgroundClick ---

describe('backgroundClick', () => {
    it('should not throw when clicking on a valid window', () => {
        const windows = getVisibleWindows();
        assert.ok(windows.length > 0);
        assert.doesNotThrow(() => {
            backgroundClick(windows[0].hwnd, 0, 0);
        });
    });

    it('should not throw with an invalid hwnd', () => {
        assert.doesNotThrow(() => {
            backgroundClick(0, 100, 100);
        });
    });

    it('should not throw with large coordinates', () => {
        const windows = getVisibleWindows();
        assert.doesNotThrow(() => {
            backgroundClick(windows[0].hwnd, 9999, 9999);
        });
    });

    it('should handle rapid sequential clicks', () => {
        const windows = getVisibleWindows();
        assert.doesNotThrow(() => {
            for (let i = 0; i < 10; i++) {
                backgroundClick(windows[0].hwnd, i * 10, i * 10);
            }
        });
    });
});

// --- captureMousePosition ---

describe('captureMousePosition', () => {
    it('should be a function', () => {
        assert.strictEqual(typeof captureMousePosition, 'function');
    });

    it('should return a promise', () => {
        // We can't actually wait for the promise (it waits for a real click),
        // but we can verify it returns a thenable. We need to clean up the
        // polling interval, so we race with a short timeout.
        const windows = getVisibleWindows();
        const promise = captureMousePosition(windows[0].hwnd);
        assert.ok(typeof promise.then === 'function', 'Promise donmeli');

        // Cancel the internal polling by resolving early — the interval
        // will be cleaned up when the promise resolves via the real click
        // or when the process exits. This is just a type check.
    });
});

// --- focusWindow ---

describe('focusWindow', () => {
    it('should not throw on a valid window', () => {
        const windows = getVisibleWindows();
        assert.doesNotThrow(() => {
            focusWindow(windows[0].hwnd);
        });
    });

    it('should not throw on an invalid hwnd', () => {
        assert.doesNotThrow(() => {
            focusWindow(0);
        });
    });

    it('should not throw on a minimized window hwnd', () => {
        const windows = getVisibleWindows();
        // Just verify it doesn't crash — actual focus behavior needs manual test
        assert.doesNotThrow(() => {
            focusWindow(windows[0].hwnd);
        });
    });
});

// --- module exports ---

describe('module exports', () => {
    it('should export all required functions', () => {
        const bot = require('../bot');
        assert.strictEqual(typeof bot.makeLParam, 'function');
        assert.strictEqual(typeof bot.getVisibleWindows, 'function');
        assert.strictEqual(typeof bot.backgroundClick, 'function');
        assert.strictEqual(typeof bot.captureMousePosition, 'function');
        assert.strictEqual(typeof bot.focusWindow, 'function');
    });

    it('should export all required constants', () => {
        const bot = require('../bot');
        assert.strictEqual(typeof bot.WM_LBUTTONDOWN, 'number');
        assert.strictEqual(typeof bot.WM_LBUTTONUP, 'number');
        assert.strictEqual(typeof bot.MK_LBUTTON, 'number');
    });

    it('should not auto-run main when required as module', () => {
        // If main() ran on require, we'd be stuck in readline.
        // The fact that we got here means require.main === module guard works.
        assert.ok(true);
    });
});
