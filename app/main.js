const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const bot = require('../bot');
const presets = require('./presets');

let mainWindow;
const activeTimers = [];
let activeCounts = [];

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

    // Set Content Security Policy
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [
                    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data:"
                ]
            }
        });
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
    // Focus target FIRST while we're still the foreground process
    bot.focusWindow(hwnd);

    // Then minimize Electron
    if (mainWindow) mainWindow.minimize();

    // Small delay so windows settle
    await new Promise(r => setTimeout(r, 300));

    const pos = await bot.captureMousePosition(hwnd);

    if (mainWindow) mainWindow.restore();

    return pos;
});

function startTimers(hwnd, points) {
    stopAllTimers();


    points.forEach((p, i) => {
        const timer = setInterval(() => {
            bot.backgroundClick(hwnd, p.x, p.y);
            activeCounts[i]++;
            const total = activeCounts.reduce((a, b) => a + b, 0);
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('click-count-update', { counts: [...activeCounts], total });
            }
        }, p.interval);
        activeTimers.push(timer);
    });
}

ipcMain.handle('start-clicking', (_event, { hwnd, points }) => {
    activeCounts = new Array(points.length).fill(0);
    startTimers(hwnd, points);
    return { success: true };
});

ipcMain.handle('stop-clicking', () => {
    stopAllTimers();
    activeCounts = [];
    return { success: true };
});

ipcMain.handle('update-points', (_event, { hwnd, points }) => {
    startTimers(hwnd, points);
    return { success: true };
});

// Preset IPC Handlers

ipcMain.handle('preset:list', () => presets.listPresets());
ipcMain.handle('preset:load', (_e, id) => presets.loadPreset(id));
ipcMain.handle('preset:save', (_e, data) => presets.savePreset(data));
ipcMain.handle('preset:delete', (_e, id) => presets.deletePreset(id));
ipcMain.handle('preset:rename', (_e, { id, newName }) => presets.renamePreset(id, newName));
ipcMain.handle('preset:duplicate', (_e, { id, newName }) => presets.duplicatePreset(id, newName));

ipcMain.handle('preset:export', async (_e, id) => {
    const preset = presets.loadPreset(id);
    if (!preset) return null;
    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: `${preset.name}.json`,
        filters: [{ name: 'Preset', extensions: ['json'] }]
    });
    if (!result.canceled) {
        fs.copyFileSync(presets.getExportPath(id), result.filePath);
        return { path: result.filePath };
    }
    return null;
});

ipcMain.handle('preset:import', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        filters: [{ name: 'Preset', extensions: ['json'] }],
        properties: ['openFile']
    });
    if (!result.canceled) {
        return presets.importPreset(result.filePaths[0]);
    }
    return null;
});

// Settings IPC Handlers

ipcMain.handle('settings:load', () => presets.loadSettings());
ipcMain.handle('settings:save', (_e, settings) => {
    presets.saveSettings(settings);
    return { success: true };
});

app.whenReady().then(() => {
    presets.init(app.getPath('userData'));
    createWindow();
});

app.on('window-all-closed', () => {
    stopAllTimers();
    app.quit();
});
