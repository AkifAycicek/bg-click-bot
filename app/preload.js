const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getWindows: () => ipcRenderer.invoke('get-windows'),
    capturePosition: (hwnd) => ipcRenderer.invoke('capture-position', hwnd),
    startClicking: (tabId, hwnd, points) => ipcRenderer.invoke('start-clicking', { tabId, hwnd, points }),
    stopClicking: (tabId) => ipcRenderer.invoke('stop-clicking', { tabId }),
    updatePoints: (tabId, hwnd, points) => ipcRenderer.invoke('update-points', { tabId, hwnd, points }),
    togglePointPause: (tabId, pointIndex) => ipcRenderer.invoke('toggle-point-pause', { tabId, pointIndex }),
    onClickCountUpdate: (callback) => {
        ipcRenderer.on('click-count-update', (_event, data) => callback(data));
    },
    removeClickCountListener: () => {
        ipcRenderer.removeAllListeners('click-count-update');
    },

    // Presets
    listPresets: () => ipcRenderer.invoke('preset:list'),
    loadPreset: (id) => ipcRenderer.invoke('preset:load', id),
    savePreset: (data) => ipcRenderer.invoke('preset:save', data),
    deletePreset: (id) => ipcRenderer.invoke('preset:delete', id),
    renamePreset: (id, newName) => ipcRenderer.invoke('preset:rename', { id, newName }),
    duplicatePreset: (id, newName) => ipcRenderer.invoke('preset:duplicate', { id, newName }),
    exportPreset: (id) => ipcRenderer.invoke('preset:export', id),
    importPreset: () => ipcRenderer.invoke('preset:import'),

    // Settings
    loadSettings: () => ipcRenderer.invoke('settings:load'),
    saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings)
});
