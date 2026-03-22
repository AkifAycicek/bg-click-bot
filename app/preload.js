const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getWindows: () => ipcRenderer.invoke('get-windows'),
    capturePosition: (hwnd) => ipcRenderer.invoke('capture-position', hwnd),
    startClicking: (hwnd, points) => ipcRenderer.invoke('start-clicking', { hwnd, points }),
    stopClicking: () => ipcRenderer.invoke('stop-clicking'),
    onClickCountUpdate: (callback) => {
        ipcRenderer.on('click-count-update', (_event, data) => callback(data));
    },
    removeClickCountListener: () => {
        ipcRenderer.removeAllListeners('click-count-update');
    }
});
