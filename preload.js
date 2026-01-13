const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close')
  },

  // Authentication
  auth: {
    isFirstRun: () => ipcRenderer.invoke('auth:isFirstRun'),
    getProfile: () => ipcRenderer.invoke('auth:getProfile'),
    verifyPassword: (password) => ipcRenderer.invoke('auth:verifyPassword', password),
    completeSetup: (data) => ipcRenderer.invoke('auth:completeSetup', data)
  },

  // Image operations (now uses SQLite BLOB storage)
  image: {
    upload: (category) => ipcRenderer.invoke('image:upload', category),
    get: (imageKey) => ipcRenderer.invoke('image:get', imageKey),
    delete: (imageKey) => ipcRenderer.invoke('image:delete', imageKey)
  },

  // Export operations
  export: {
    csv: (data, defaultFileName) => ipcRenderer.invoke('export:csv', data, defaultFileName)
  },

  // Database operations
  db: {
    getAll: (collectionName) => ipcRenderer.invoke('db:getAll', collectionName),
    getOne: (collectionName, id) => ipcRenderer.invoke('db:getOne', collectionName, id),
    insert: (collectionName, document) => ipcRenderer.invoke('db:insert', collectionName, document),
    update: (collectionName, id, update) => ipcRenderer.invoke('db:update', collectionName, id, update),
    delete: (collectionName, id) => ipcRenderer.invoke('db:delete', collectionName, id),
    getDashboardStats: () => ipcRenderer.invoke('db:getDashboardStats'),
    getSettings: () => ipcRenderer.invoke('db:getSettings'),
    updateSettings: (updates) => ipcRenderer.invoke('db:updateSettings', updates),
    // History
    getHistory: (startDate, endDate) => ipcRenderer.invoke('db:getHistory', startDate, endDate),
    // Predictions
    getPredictions: () => ipcRenderer.invoke('db:getPredictions')
  }
});
