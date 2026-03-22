const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const bot = require('../bot');
const presets = require('./presets');

let mainWindow;
const instances = new Map(); // tabId -> { timers: [], counts: [] }

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
        stopAllInstances();
        mainWindow = null;
    });
}

function stopInstance(tabId) {
    const instance = instances.get(tabId);
    if (instance) {
        instance.timers.forEach(t => clearInterval(t));
        instances.delete(tabId);
    }
}

function stopAllInstances() {
    for (const [tabId] of instances) {
        stopInstance(tabId);
    }
}

function startInstance(tabId, hwnd, points) {
    stopInstance(tabId);

    const counts = new Array(points.length).fill(0);
    const paused = new Array(points.length).fill(false);
    const timers = [];

    points.forEach((p, i) => {
        const timer = setInterval(() => {
            if (paused[i]) return;
            bot.backgroundClick(hwnd, p.x, p.y);
            counts[i]++;
            const total = counts.reduce((a, b) => a + b, 0);
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('click-count-update', { tabId, counts: [...counts], total, paused: [...paused] });
            }
        }, p.interval);
        timers.push(timer);
    });

    instances.set(tabId, { timers, counts, paused, hwnd, points });
}

// IPC Handlers

ipcMain.handle('get-windows', () => {
    const windows = bot.getVisibleWindows();
    return windows.map(w => ({
        ...w,
        thumbnail: bot.captureWindowThumbnail(w.hwnd)
    }));
});

ipcMain.handle('capture-position', async (_event, hwnd) => {
    bot.focusWindow(hwnd);
    if (mainWindow) mainWindow.minimize();
    await new Promise(r => setTimeout(r, 300));
    const pos = await bot.captureMousePosition(hwnd);
    if (mainWindow) mainWindow.restore();
    return pos;
});

ipcMain.handle('start-clicking', (_event, { tabId, hwnd, points }) => {
    startInstance(tabId || 'default', hwnd, points);
    return { success: true };
});

ipcMain.handle('stop-clicking', (_event, { tabId } = {}) => {
    stopInstance(tabId || 'default');
    return { success: true };
});

ipcMain.handle('toggle-point-pause', (_event, { tabId, pointIndex }) => {
    const instance = instances.get(tabId);
    if (!instance || pointIndex < 0 || pointIndex >= instance.paused.length) return { success: false };
    instance.paused[pointIndex] = !instance.paused[pointIndex];
    if (mainWindow && !mainWindow.isDestroyed()) {
        const total = instance.counts.reduce((a, b) => a + b, 0);
        mainWindow.webContents.send('click-count-update', {
            tabId, counts: [...instance.counts], total, paused: [...instance.paused]
        });
    }
    return { success: true, paused: instance.paused[pointIndex] };
});

ipcMain.handle('update-points', (_event, { tabId, hwnd, points }) => {
    const instance = instances.get(tabId || 'default');
    const counts = instance ? [...instance.counts] : [];
    startInstance(tabId || 'default', hwnd, points);
    // Restore counts for existing points
    const newInstance = instances.get(tabId || 'default');
    if (newInstance) {
        for (let i = 0; i < Math.min(counts.length, newInstance.counts.length); i++) {
            newInstance.counts[i] = counts[i];
        }
    }
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
    stopAllInstances();
    app.quit();
});
