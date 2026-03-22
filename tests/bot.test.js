const { describe, it } = require('node:test');
const assert = require('node:assert');
const { makeLParam, getVisibleWindows, backgroundClick, WM_LBUTTONDOWN, WM_LBUTTONUP, MK_LBUTTON } = require('../bot');

describe('makeLParam', () => {
    it('should encode x and y into a single LPARAM value', () => {
        // lParam = (y << 16) | (x & 0xFFFF)
        const result = makeLParam(100, 200);
        const expectedY = (result >> 16) & 0xFFFF;
        const expectedX = result & 0xFFFF;
        assert.strictEqual(expectedX, 100);
        assert.strictEqual(expectedY, 200);
    });

    it('should handle zero coordinates', () => {
        const result = makeLParam(0, 0);
        assert.strictEqual(result, 0);
    });

    it('should handle max 16-bit values', () => {
        const result = makeLParam(65535, 65535);
        const x = result & 0xFFFF;
        const y = (result >> 16) & 0xFFFF;
        assert.strictEqual(x, 65535);
        assert.strictEqual(y, 65535);
    });

    it('should handle typical game coordinates', () => {
        const result = makeLParam(512, 384);
        const x = result & 0xFFFF;
        const y = (result >> 16) & 0xFFFF;
        assert.strictEqual(x, 512);
        assert.strictEqual(y, 384);
    });
});

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
});

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
});

describe('backgroundClick', () => {
    it('should not throw when clicking on a valid window', () => {
        const windows = getVisibleWindows();
        assert.ok(windows.length > 0);
        // Click at 0,0 on the first visible window — PostMessage won't cause visible side effects
        assert.doesNotThrow(() => {
            backgroundClick(windows[0].hwnd, 0, 0);
        });
    });

    it('should not throw with an invalid hwnd', () => {
        // PostMessage returns false for invalid hwnd but does not throw
        assert.doesNotThrow(() => {
            backgroundClick(0, 100, 100);
        });
    });
});
