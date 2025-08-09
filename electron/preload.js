const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  initializeDatabase: () => ipcRenderer.invoke('db:initialize'),
  getDatabasePath: () => ipcRenderer.invoke('get-database-path'),
  getDatabaseDirectory: () => ipcRenderer.invoke('get-database-directory'),
  selectDatabaseFile: () => ipcRenderer.invoke('select-database-file'),
  copyDatabaseFile: (sourcePath, targetPath) => ipcRenderer.invoke('copy-database-file', sourcePath, targetPath),
  checkDatabaseExists: (dbPath) => ipcRenderer.invoke('check-database-exists', dbPath),
  
  // Menu actions
  onMenuAction: (callback) => ipcRenderer.on('menu-action', callback),
  
  // File operations
  exportData: () => ipcRenderer.invoke('file:export'),
  importData: () => ipcRenderer.invoke('file:import'),
  
  // App info
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  getAppPath: () => ipcRenderer.invoke('app:path'),
  
  // Window operations
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
})

// Handle window controls
window.addEventListener('DOMContentLoaded', () => {
  // Add any initialization code here
  console.log('Preload script loaded')
}) 