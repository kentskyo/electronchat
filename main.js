const { app, BrowserWindow } = require('electron');
const path = require('path')
// for hot reloading
require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
});

let win
const createWindow = () => {
    win = new BrowserWindow({
        width: 850,
        height: 850,
        alwaysOnTop: false, // useful while debugging in render console logs
        webPreferences: {
            nodeIntegration: true,  // we need to import libraries in render
            contextIsolation: false // an our page is internal
        }
    });
    win.loadFile('index.html');
    //win.webContents.openDevTools()
};

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});