const koffi = require('koffi');
const readline = require('readline');

// Windows API
const user32 = koffi.load('user32.dll');

// POINT struct for GetCursorPos / ScreenToClient
const POINT = koffi.struct('POINT', { x: 'int', y: 'int' });

// Callback type for EnumWindows
const WNDENUMPROC = koffi.proto('WNDENUMPROC', 'int', ['int', 'int']);

// Window functions
const EnumWindows = user32.func('EnumWindows', 'int', [koffi.pointer(WNDENUMPROC), 'int']);
const GetWindowTextA = user32.func('GetWindowTextA', 'int', ['int', 'uint8 *', 'int']);
const GetWindowTextLengthA = user32.func('GetWindowTextLengthA', 'int', ['int']);
const IsWindowVisible = user32.func('IsWindowVisible', 'int', ['int']);
const PostMessageA = user32.func('PostMessageA', 'int', ['int', 'uint', 'int', 'int']);
const GetCursorPos = user32.func('GetCursorPos', 'int', [koffi.out(koffi.pointer(POINT))]);
const ScreenToClient = user32.func('ScreenToClient', 'int', ['int', koffi.inout(koffi.pointer(POINT))]);
const GetAsyncKeyState = user32.func('GetAsyncKeyState', 'short', ['int']);
const SetForegroundWindow = user32.func('SetForegroundWindow', 'int', ['int']);
const ShowWindow = user32.func('ShowWindow', 'int', ['int', 'int']);
const IsIconic = user32.func('IsIconic', 'int', ['int']);
const GetWindowLongA = user32.func('GetWindowLongA', 'long', ['int', 'int']);
const GetWindow = user32.func('GetWindow', 'int', ['int', 'uint']);

const GWL_EXSTYLE = -20;
const WS_EX_TOOLWINDOW = 0x00000080;
const WS_EX_APPWINDOW = 0x00040000;
const WS_EX_NOACTIVATE = 0x08000000;
const GW_OWNER = 4;

const dwmapi = koffi.load('dwmapi.dll');
const DwmGetWindowAttribute = dwmapi.func('DwmGetWindowAttribute', 'long', ['int', 'uint', 'uint *', 'uint']);
const DWMWA_CLOAKED = 14;

// GDI32 for window capture
const gdi32 = koffi.load('gdi32.dll');
const RECT = koffi.struct('RECT', { left: 'int', top: 'int', right: 'int', bottom: 'int' });
const BITMAPINFOHEADER = koffi.struct('BITMAPINFOHEADER', {
    biSize: 'uint', biWidth: 'int', biHeight: 'int', biPlanes: 'ushort',
    biBitCount: 'ushort', biCompression: 'uint', biSizeImage: 'uint',
    biXPelsPerMeter: 'int', biYPelsPerMeter: 'int', biClrUsed: 'uint', biClrImportant: 'uint'
});
const GetClientRect = user32.func('GetClientRect', 'int', ['int', koffi.out(koffi.pointer(RECT))]);
const GetDC = user32.func('GetDC', 'int', ['int']);
const ReleaseDC = user32.func('ReleaseDC', 'int', ['int', 'int']);
const CreateCompatibleDC = gdi32.func('CreateCompatibleDC', 'int', ['int']);
const CreateCompatibleBitmap = gdi32.func('CreateCompatibleBitmap', 'int', ['int', 'int', 'int']);
const SelectObject = gdi32.func('SelectObject', 'int', ['int', 'int']);
const DeleteObject = gdi32.func('DeleteObject', 'int', ['int']);
const DeleteDC = gdi32.func('DeleteDC', 'int', ['int']);
const GetDIBits = gdi32.func('GetDIBits', 'int', ['int', 'int', 'uint', 'uint', 'uint8 *', koffi.inout(koffi.pointer(BITMAPINFOHEADER)), 'uint']);
const PrintWindow = user32.func('PrintWindow', 'int', ['int', 'int', 'uint']);
const StretchBlt = gdi32.func('StretchBlt', 'int', ['int', 'int', 'int', 'int', 'int', 'int', 'int', 'int', 'int', 'int', 'uint']);
const SetStretchBltMode = gdi32.func('SetStretchBltMode', 'int', ['int', 'int']);
const PW_RENDERFULLCONTENT = 0x00000002;
const SRCCOPY = 0x00CC0020;
const HALFTONE = 4;
const BI_RGB = 0;
const GetForegroundWindow = user32.func('GetForegroundWindow', 'int', []);
const SetWindowPos = user32.func('SetWindowPos', 'int', ['int', 'int', 'int', 'int', 'int', 'int', 'uint']);
const SystemParametersInfoA = user32.func('SystemParametersInfoA', 'int', ['uint', 'uint', 'uint *', 'uint']);

const SW_RESTORE = 9;
const SPI_GETFOREGROUNDLOCKTIMEOUT = 0x2000;
const SPI_SETFOREGROUNDLOCKTIMEOUT = 0x2001;
const SPIF_SENDCHANGE = 0x0002;
const HWND_TOPMOST = -1;
const HWND_NOTOPMOST = -2;
const SWP_NOMOVE = 0x0002;
const SWP_NOSIZE = 0x0001;

function focusWindow(hwnd) {
    // Step 1: Restore if minimized
    if (IsIconic(hwnd)) {
        ShowWindow(hwnd, SW_RESTORE);
    }

    // Step 2: Try direct SetForegroundWindow (works if we're foreground)
    if (SetForegroundWindow(hwnd) && GetForegroundWindow() === hwnd) {
        return;
    }

    // Step 3: Disable foreground lock timeout (AutoHotkey method)
    const originalTimeout = Buffer.alloc(4);
    SystemParametersInfoA(SPI_GETFOREGROUNDLOCKTIMEOUT, 0, originalTimeout, 0);
    const zeroTimeout = Buffer.alloc(4, 0);
    SystemParametersInfoA(SPI_SETFOREGROUNDLOCKTIMEOUT, 0, zeroTimeout, SPIF_SENDCHANGE);

    SetForegroundWindow(hwnd);

    // Restore original timeout
    SystemParametersInfoA(SPI_SETFOREGROUNDLOCKTIMEOUT, 0, originalTimeout, SPIF_SENDCHANGE);

    // Step 4: Fallback - topmost toggle
    if (GetForegroundWindow() !== hwnd) {
        SetWindowPos(hwnd, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE);
        SetWindowPos(hwnd, HWND_NOTOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE);
        SetForegroundWindow(hwnd);
    }
}

function captureWindowThumbnail(hwnd, thumbWidth = 160, thumbHeight = 100) {
    try {
        // Get window size
        const rect = {};
        GetClientRect(hwnd, rect);
        const width = rect.right - rect.left;
        const height = rect.bottom - rect.top;
        if (width <= 0 || height <= 0) return null;

        // Create DC and bitmap at full window size
        const screenDC = GetDC(0);
        const memDC = CreateCompatibleDC(screenDC);
        const bitmap = CreateCompatibleBitmap(screenDC, width, height);
        const oldBitmap = SelectObject(memDC, bitmap);

        // Capture window content (works even when minimized)
        PrintWindow(hwnd, memDC, PW_RENDERFULLCONTENT);

        // Create thumbnail DC and bitmap
        const thumbDC = CreateCompatibleDC(screenDC);
        const thumbBitmap = CreateCompatibleBitmap(screenDC, thumbWidth, thumbHeight);
        const oldThumbBitmap = SelectObject(thumbDC, thumbBitmap);

        // Scale down
        SetStretchBltMode(thumbDC, HALFTONE);
        StretchBlt(thumbDC, 0, 0, thumbWidth, thumbHeight, memDC, 0, 0, width, height, SRCCOPY);

        // Read pixels from thumbnail
        const bmi = {
            biSize: 40, biWidth: thumbWidth, biHeight: -thumbHeight, biPlanes: 1,
            biBitCount: 32, biCompression: BI_RGB, biSizeImage: 0,
            biXPelsPerMeter: 0, biYPelsPerMeter: 0, biClrUsed: 0, biClrImportant: 0
        };
        const pixelData = Buffer.alloc(thumbWidth * thumbHeight * 4);
        GetDIBits(thumbDC, thumbBitmap, 0, thumbHeight, pixelData, bmi, 0);

        // Cleanup GDI
        SelectObject(memDC, oldBitmap);
        DeleteObject(bitmap);
        DeleteDC(memDC);
        SelectObject(thumbDC, oldThumbBitmap);
        DeleteObject(thumbBitmap);
        DeleteDC(thumbDC);
        ReleaseDC(0, screenDC);

        // Convert BGRA to BMP file buffer
        const fileHeaderSize = 14;
        const infoHeaderSize = 40;
        const dataSize = thumbWidth * thumbHeight * 4;
        const fileSize = fileHeaderSize + infoHeaderSize + dataSize;
        const bmp = Buffer.alloc(fileSize);

        // BMP file header
        bmp.write('BM', 0);
        bmp.writeUInt32LE(fileSize, 2);
        bmp.writeUInt32LE(0, 6);
        bmp.writeUInt32LE(fileHeaderSize + infoHeaderSize, 10);

        // BMP info header (top-down)
        bmp.writeUInt32LE(infoHeaderSize, 14);
        bmp.writeInt32LE(thumbWidth, 18);
        bmp.writeInt32LE(thumbHeight, 22); // positive = bottom-up
        bmp.writeUInt16LE(1, 26);
        bmp.writeUInt16LE(32, 28);
        bmp.writeUInt32LE(0, 30);
        bmp.writeUInt32LE(dataSize, 34);

        // Flip rows (GetDIBits with negative height gives top-down, BMP needs bottom-up)
        const rowSize = thumbWidth * 4;
        for (let y = 0; y < thumbHeight; y++) {
            pixelData.copy(bmp, fileHeaderSize + infoHeaderSize + (thumbHeight - 1 - y) * rowSize, y * rowSize, (y + 1) * rowSize);
        }

        return 'data:image/bmp;base64,' + bmp.toString('base64');
    } catch {
        return null;
    }
}

// Messages
const WM_LBUTTONDOWN = 0x0201;
const WM_LBUTTONUP = 0x0202;
const MK_LBUTTON = 0x0001;

function makeLParam(x, y) {
    return (y << 16) | (x & 0xFFFF);
}

function isAltTabWindow(hwnd) {
    const exStyle = GetWindowLongA(hwnd, GWL_EXSTYLE);

    // Skip tool windows (unless they have WS_EX_APPWINDOW)
    if ((exStyle & WS_EX_TOOLWINDOW) && !(exStyle & WS_EX_APPWINDOW)) return false;

    // Skip noactivate windows
    if (exStyle & WS_EX_NOACTIVATE) return false;

    // Skip owned windows without WS_EX_APPWINDOW (child dialogs etc.)
    const owner = GetWindow(hwnd, GW_OWNER);
    if (owner && !(exStyle & WS_EX_APPWINDOW)) return false;

    // Skip cloaked UWP windows (Notification Center, Settings, Lock Screen, etc.)
    const cloaked = Buffer.alloc(4);
    DwmGetWindowAttribute(hwnd, DWMWA_CLOAKED, cloaked, 4);
    if (cloaked.readUInt32LE(0) !== 0) return false;

    return true;
}

function getVisibleWindows() {
    const windows = [];
    const cb = koffi.register((hwnd, _lParam) => {
        if (IsWindowVisible(hwnd) && isAltTabWindow(hwnd)) {
            const len = GetWindowTextLengthA(hwnd);
            if (len > 0) {
                const buf = Buffer.alloc(len + 1);
                GetWindowTextA(hwnd, buf, len + 1);
                const title = buf.toString('utf8', 0, len);
                if (title.trim().length > 0) {
                    windows.push({ hwnd, title });
                }
            }
        }
        return 1; // continue
    }, koffi.pointer(WNDENUMPROC));

    EnumWindows(cb, 0);
    koffi.unregister(cb);
    return windows;
}

function backgroundClick(hwnd, x, y) {
    const lParam = makeLParam(x, y);
    PostMessageA(hwnd, WM_LBUTTONDOWN, MK_LBUTTON, lParam);
    PostMessageA(hwnd, WM_LBUTTONUP, 0, lParam);
}

function captureMousePosition(hwnd) {
    return new Promise(async (resolve) => {
        console.log('\n  Hedef pencerede tiklamak istediginiz noktaya fare ile tiklayin...');
        console.log('  (Yakalamak icin sol tusa basin)\n');

        const VK_LBUTTON = 0x01;
        let wasPressed = false;

        const poll = setInterval(() => {
            const state = GetAsyncKeyState(VK_LBUTTON);
            const isPressed = (state & 0x8000) !== 0;

            if (isPressed && !wasPressed) {
                const pt = {};
                GetCursorPos(pt);
                const clientPt = { x: pt.x, y: pt.y };
                ScreenToClient(hwnd, clientPt);

                clearInterval(poll);
                console.log(`  Yakalanan koordinat: (${clientPt.x}, ${clientPt.y})`);
                resolve({ x: clientPt.x, y: clientPt.y });
            }
            wasPressed = isPressed;
        }, 50);
    });
}

function askQuestion(rl, question) {
    return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('\n=== Background Clicker Bot ===\n');

    // 1. List windows
    const windows = getVisibleWindows();
    console.log('Acik pencereler:\n');
    windows.forEach((w, i) => {
        console.log(`  [${i}] ${w.title}`);
    });

    const windowIdx = parseInt(await askQuestion(rl, '\nPencere numarasi secin: '));
    if (isNaN(windowIdx) || windowIdx < 0 || windowIdx >= windows.length) {
        console.log('Gecersiz secim!');
        rl.close();
        return;
    }

    const selected = windows[windowIdx];
    console.log(`\nSecilen: "${selected.title}" (hwnd: ${selected.hwnd})`);

    // 2. How many points?
    const pointCountStr = await askQuestion(rl, '\nKac noktaya tiklanacak? ');
    const pointCount = parseInt(pointCountStr);

    if (isNaN(pointCount) || pointCount < 1) {
        console.log('Gecersiz sayi!');
        rl.close();
        return;
    }

    // 3. Get click coordinates for each point
    const points = [];
    let rlActive = rl;

    for (let i = 0; i < pointCount; i++) {
        console.log(`\n--- Nokta ${i + 1}/${pointCount} ---`);
        console.log('Koordinat secimi:');
        console.log('  [1] Fare ile tikla (pencerede tiklayin, koordinat yakalansin)');
        console.log('  [2] Manuel gir (X, Y degerlerini yaz)');

        const coordMethod = await askQuestion(rlActive, '\nSecim (1/2): ');

        let x, y;
        if (coordMethod.trim() === '1') {
            rlActive.close();
            const pos = await captureMousePosition(selected.hwnd);
            x = pos.x;
            y = pos.y;
            rlActive = readline.createInterface({ input: process.stdin, output: process.stdout });
        } else {
            const xStr = await askQuestion(rlActive, '\nX koordinati (pencere icindeki): ');
            const yStr = await askQuestion(rlActive, 'Y koordinati (pencere icindeki): ');
            x = parseInt(xStr);
            y = parseInt(yStr);

            if (isNaN(x) || isNaN(y)) {
                console.log('Gecersiz koordinat!');
                rlActive.close();
                return;
            }
        }

        // Get interval for this point
        const intervalStr = await askQuestion(rlActive, `Nokta ${i + 1} tiklama araligi (ms): `);
        const interval = parseInt(intervalStr);

        if (isNaN(interval) || interval < 100) {
            console.log('Gecersiz aralik! (min 100ms)');
            rlActive.close();
            return;
        }

        points.push({ x, y, interval });
    }

    rlActive.close();

    console.log(`\nBot baslatildi!`);
    console.log(`  Pencere: ${selected.title}`);
    console.log(`  Noktalar:`);
    points.forEach((p, i) => console.log(`    ${i + 1}. (${p.x}, ${p.y}) - ${p.interval}ms`));
    console.log(`\nDurdurmak icin Ctrl+C basin.\n`);

    let totalClicks = 0;
    const clickCounts = new Array(points.length).fill(0);
    const timers = [];

    points.forEach((p, i) => {
        const timer = setInterval(() => {
            backgroundClick(selected.hwnd, p.x, p.y);
            clickCounts[i]++;
            totalClicks++;
            const status = points.map((_, j) => `N${j + 1}:${clickCounts[j]}`).join(' | ');
            process.stdout.write(`\rToplam: ${totalClicks} | ${status}`);
        }, p.interval);
        timers.push(timer);
    });

    process.on('SIGINT', () => {
        timers.forEach(t => clearInterval(t));
        console.log(`\n\nBot durduruldu. Toplam ${totalClicks} tiklama yapildi.`);
        process.exit(0);
    });
}

// Export for testing
module.exports = {
    makeLParam,
    getVisibleWindows,
    backgroundClick,
    captureMousePosition,
    WM_LBUTTONDOWN,
    WM_LBUTTONUP,
    MK_LBUTTON,
    focusWindow,
    captureWindowThumbnail
};

// Run only when executed directly
if (require.main === module) {
    main().catch(err => {
        console.error('Hata:', err.message);
        process.exit(1);
    });
}
