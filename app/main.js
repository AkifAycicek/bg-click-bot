const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const bot = require('../bot');

let mainWindow;
const activeTimers = [];

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 750,
        height: 650,
        resizable: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, '..', 'dist-renderer', 'index.html'));
    }

    mainWindow.on('closed', () => {
        stopAllTimers();
        mainWindow = null;
    });
}

function stopAllTimers() {
    activeTimers.forEach(t => clearInterval(t));
    activeTimers.length = 0;
}

// IPC Handlers

ipcMain.handle('get-windows', () => {
    return bot.getVisibleWindows();
});

ipcMain.handle('capture-position', async (_event, hwnd) => {
    if (mainWindow) mainWindow.minimize();

    // Small delay so minimize completes before capture starts
    await new Promise(r => setTimeout(r, 300));

    const pos = await bot.captureMousePosition(hwnd);

    if (mainWindow) mainWindow.restore();

    return pos;
});

ipcMain.handle('start-clicking', (_event, { hwnd, points }) => {
    stopAllTimers();

    const counts = new Array(points.length).fill(0);

    points.forEach((p, i) => {
        const timer = setInterval(() => {
            bot.backgroundClick(hwnd, p.x, p.y);
            counts[i]++;
            const total = counts.reduce((a, b) => a + b, 0);
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('click-count-update', { counts: [...counts], total });
            }
        }, p.interval);
        activeTimers.push(timer);
    });

    return { success: true };
});

ipcMain.handle('stop-clicking', () => {
    stopAllTimers();
    return { success: true };
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    stopAllTimers();
    app.quit();
});
