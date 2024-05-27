const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const waitOn = require('wait-on');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false, // Ensure node integration is off
      sandbox: false,
    },
  });

  const startUrl = 'http://localhost:3000';

  const opts = {
    resources: [startUrl],
    delay: 1000, // Initial delay in ms before checking the resources
    timeout: 30000, // Timeout in ms
    interval: 1000, // Interval to check the resources
  };

  waitOn(opts, (err) => {
    if (err) {
      console.error('Failed to load URL:', err);
      app.quit();
    } else {
      mainWindow.loadURL(startUrl);

      // Set Content Security Policy dynamically
      mainWindow.webContents.on('did-finish-load', () => {
        const csp = `
          default-src 'self';
          script-src 'self' 'unsafe-inline'; 
          style-src 'self' 'unsafe-inline'; 
          font-src 'self';
          img-src 'self' data:;
          connect-src 'self' http://localhost:5000;
          connect-src 'self' http://localhost:3000;
        `;
        mainWindow.webContents.executeJavaScript(`
          (() => {
            const meta = document.createElement('meta');
            meta.httpEquiv = 'Content-Security-Policy';
            meta.content = "${csp.replace(/\n/g, ' ')}";
            document.getElementsByTagName('head')[0].appendChild(meta);
          })();
        `).then(() => {
          console.log('CSP meta tag added successfully.');
        }).catch((error) => {
          console.error('Failed to add CSP meta tag:', error);
        });
      });

      mainWindow.webContents.openDevTools(); // Open DevTools in all cases
    }
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('show-save-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return result.filePaths[0];
});
