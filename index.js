const { app, BrowserWindow, globalShortcut } = require('electron')
const { format } = require('url')
const path = require('path')
require('./app.js')

process.env.NODE_ENV = 'production'
const isDev = process.env.NODE_ENV !== 'production' ? true : false
const isMac = process.platform === 'darvin' ? true : false
const port = process.env.PORT || 3000
let mainWindow

function createWindow () {
  mainWindow = new BrowserWindow({
    title: 'Digital Notary Chat',
    width: 500,
    height: 400,
    icon: './public/img/chat-icon.png',
    resizable: isDev ? true : false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  mainWindow.loadURL(`http://localhost:${port}/`)

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }
}

app.on('ready', () => {
  createWindow()

  globalShortcut
    .register(
      isMac ? 'Command+Alt+I' : 'Ctrl+Shift+I',
      () => mainWindow.toggleDevTools()
    )

  mainWindow.on('ready', () => (mainWindow = null))
})

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
