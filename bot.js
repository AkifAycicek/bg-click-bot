const koffi = require('koffi');
const readline = require('readline');

// Windows API
const user32 = koffi.load('user32.dll');
const kernel32 = koffi.load('kernel32.dll');

// Window functions
const FindWindowA = user32.func('FindWindowA', 'int', ['str', 'str']);
const FindWindowExA = user32.func('FindWindowExA', 'int', ['int', 'int', 'str', 'str']);
const EnumWindows = user32.func('EnumWindows', 'int', ['pointer', 'int']);
const GetWindowTextA = user32.func('GetWindowTextA', 'int', ['int', 'uint8 *', 'int']);
const GetWindowTextLengthA = user32.func('GetWindowTextLengthA', 'int', ['int']);
const IsWindowVisible = user32.func('IsWindowVisible', 'int', ['int']);
const PostMessageA = user32.func('PostMessageA', 'int', ['int', 'uint', 'int', 'int']);
const GetClientRect = user32.func('GetClientRect', 'int', ['int', 'int *']);

// Messages
const WM_LBUTTONDOWN = 0x0201;
const WM_LBUTTONUP = 0x0202;
const MK_LBUTTON = 0x0001;

function makeLParam(x, y) {
    return (y << 16) | (x & 0xFFFF);
}

function getVisibleWindows() {
    const windows = [];
    const cb = koffi.register((hwnd, _lParam) => {
        if (IsWindowVisible(hwnd)) {
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
    }, koffi.pointer(koffi.proto('WNDENUMPROC', 'int', ['int', 'int'])));

    EnumWindows(cb, 0);
    koffi.unregister(cb);
    return windows;
}

function backgroundClick(hwnd, x, y) {
    const lParam = makeLParam(x, y);
    PostMessageA(hwnd, WM_LBUTTONDOWN, MK_LBUTTON, lParam);
    PostMessageA(hwnd, WM_LBUTTONUP, 0, lParam);
}

function askQuestion(rl, question) {
    return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('\n=== SRO Background Clicker Bot ===\n');

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

    // 2. Get click coordinates
    const xStr = await askQuestion(rl, '\nX koordinati (pencere icindeki): ');
    const yStr = await askQuestion(rl, 'Y koordinati (pencere icindeki): ');
    const x = parseInt(xStr);
    const y = parseInt(yStr);

    if (isNaN(x) || isNaN(y)) {
        console.log('Gecersiz koordinat!');
        rl.close();
        return;
    }

    // 3. Get interval
    const intervalStr = await askQuestion(rl, '\nTiklama araligi (ms): ');
    const interval = parseInt(intervalStr);

    if (isNaN(interval) || interval < 100) {
        console.log('Gecersiz aralik! (min 100ms)');
        rl.close();
        return;
    }

    rl.close();

    console.log(`\nBot baslatildi!`);
    console.log(`  Pencere: ${selected.title}`);
    console.log(`  Konum: (${x}, ${y})`);
    console.log(`  Aralik: ${interval}ms`);
    console.log(`\nDurdurmak icin Ctrl+C basin.\n`);

    let clickCount = 0;
    const timer = setInterval(() => {
        backgroundClick(selected.hwnd, x, y);
        clickCount++;
        process.stdout.write(`\rTiklama sayisi: ${clickCount}`);
    }, interval);

    process.on('SIGINT', () => {
        clearInterval(timer);
        console.log(`\n\nBot durduruldu. Toplam ${clickCount} tiklama yapildi.`);
        process.exit(0);
    });
}

main().catch(err => {
    console.error('Hata:', err.message);
    process.exit(1);
});
