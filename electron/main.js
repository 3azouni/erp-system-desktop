const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const isDev = require('electron-is-dev')

let mainWindow

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/icon.ico'),
    titleBarStyle: 'default',
    show: false
  })

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    // In production, start the Next.js server and load from it
    const { spawn } = require('child_process')
    const serverProcess = spawn('npm', ['start'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    })
    
    // Wait for server to start
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:3000')
    }, 3000)
    
    // Handle server process cleanup
    app.on('before-quit', () => {
      serverProcess.kill()
    })
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Create menu template
const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'New Product',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          mainWindow.webContents.send('menu-action', 'new-product')
        }
      },
      {
        label: 'New Order',
        accelerator: 'CmdOrCtrl+Shift+N',
        click: () => {
          mainWindow.webContents.send('menu-action', 'new-order')
        }
      },
      { type: 'separator' },
      {
        label: 'Export Data',
        click: () => {
          mainWindow.webContents.send('menu-action', 'export-data')
        }
      },
      {
        label: 'Import Data',
        click: () => {
          mainWindow.webContents.send('menu-action', 'import-data')
        }
      },
      { type: 'separator' },
      {
        label: 'Exit',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
        click: () => {
          app.quit()
        }
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'close' }
    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'About 3DP Commander',
        click: () => {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'About 3DP Commander',
            message: '3DP Commander Desktop',
            detail: 'Version 1.0.0\nA comprehensive 3D printing business management system.'
          })
        }
      }
    ]
  }
]

// Build menu
const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

// App event handlers
app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Database path management
function getDatabasePath() {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, '3dp-commander.db')
  return dbPath
}

function getDatabaseDirectory() {
  const userDataPath = app.getPath('userData')
  return path.dirname(path.join(userDataPath, '3dp-commander.db'))
}

// IPC handlers for database operations
ipcMain.handle('get-database-path', () => {
  return getDatabasePath()
})

ipcMain.handle('get-database-directory', () => {
  return getDatabaseDirectory()
})

ipcMain.handle('select-database-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Database File',
    filters: [
      { name: 'SQLite Database', extensions: ['db', 'sqlite', 'sqlite3'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  })
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0]
  }
  return null
})

ipcMain.handle('copy-database-file', async (event, sourcePath, targetPath) => {
  try {
    fs.copyFileSync(sourcePath, targetPath)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('check-database-exists', async (event, dbPath) => {
  try {
    return fs.existsSync(dbPath)
  } catch (error) {
    return false
  }
})

// Handle security warnings
process.on('warning', (warning) => {
  console.warn(warning.name, warning.message)
}) 