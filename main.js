const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const ini = require('ini');
const database = require('./database');

// Disable context menu
Menu.setApplicationMenu(null);

// Get config file path (works in both dev and production)
function getConfigPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'config.ini');
  }
  return path.join(__dirname, 'config.ini');
}

// Load configuration from INI file
function loadConfig() {
  const configPath = getConfigPath();

  const defaultConfig = {
    database: {
      filename: 'finance_tracker.db'
    },
    app: {
      window_width: 1400,
      window_height: 900,
      min_width: 1000,
      min_height: 700
    }
  };

  try {
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const parsedConfig = ini.parse(configContent);
      return {
        database: { ...defaultConfig.database, ...parsedConfig.database },
        app: { ...defaultConfig.app, ...parsedConfig.app }
      };
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }

  return defaultConfig;
}

const config = loadConfig();
let mainWindow = null;

// Get database path
function getDatabasePath() {
  return path.join(app.getPath('userData'), config.database.filename || 'finance_tracker.db');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: parseInt(config.app.window_width) || 1400,
    height: parseInt(config.app.window_height) || 900,
    minWidth: parseInt(config.app.min_width) || 1000,
    minHeight: parseInt(config.app.min_height) || 700,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
}

// ==================== WINDOW CONTROLS ====================

ipcMain.on('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window:close', () => {
  mainWindow?.close();
});

// ==================== AUTH HANDLERS ====================

ipcMain.handle('auth:isFirstRun', async () => {
  try {
    const isFirst = database.isFirstRun();
    return { success: true, isFirstRun: isFirst };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('auth:getProfile', async () => {
  try {
    const settings = database.getSettings();
    return {
      success: true,
      data: {
        name: settings?.name || 'User',
        profileImage: settings?.profileImage || null,
        currency: settings?.currency || 'EUR'
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('auth:verifyPassword', async (event, password) => {
  try {
    const settings = database.getSettings();
    if (!settings?.masterPasswordHash) {
      return { success: false, error: 'No password set' };
    }
    const isValid = await database.verifyPassword(password, settings.masterPasswordHash);
    return { success: true, isValid };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('auth:completeSetup', async (event, { name, currency, password, profileImage }) => {
  try {
    await database.completeSetup(name, currency, password, profileImage);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ==================== IMAGE HANDLERS (SQLite BLOB) ====================

ipcMain.handle('image:upload', async (event, category) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'] }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const sourcePath = result.filePaths[0];
    const ext = path.extname(sourcePath).slice(1);
    const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
    const imageKey = `${category}_${Date.now()}`;

    // Read file as buffer and store in SQLite
    const imageData = fs.readFileSync(sourcePath);
    database.saveImage(imageKey, imageData, mimeType);

    return { success: true, imageKey };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('image:get', async (event, imageKey) => {
  try {
    if (!imageKey) {
      return { success: false, error: 'No image key provided' };
    }

    const image = database.getImage(imageKey);
    if (!image) {
      return { success: false, error: 'Image not found' };
    }

    // Convert buffer to base64 data URI
    const base64 = Buffer.from(image.data).toString('base64');
    const dataUri = `data:${image.mimeType};base64,${base64}`;

    return { success: true, data: dataUri };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('image:delete', async (event, imageKey) => {
  try {
    if (imageKey) {
      database.deleteImage(imageKey);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ==================== DATABASE CRUD HANDLERS ====================

ipcMain.handle('db:getAll', async (event, collectionName) => {
  try {
    const data = database.getAll(collectionName);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:getOne', async (event, collectionName, id) => {
  try {
    const data = database.getOne(collectionName, id);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:insert', async (event, collectionName, document) => {
  try {
    const result = database.insert(collectionName, document);
    return { success: true, data: { insertedId: result.insertedId } };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:update', async (event, collectionName, id, update) => {
  try {
    const result = database.update(collectionName, id, update);
    return { success: true, data: { modifiedCount: result.modifiedCount } };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:delete', async (event, collectionName, id) => {
  try {
    const result = database.deleteOne(collectionName, id);
    return { success: true, data: { deletedCount: result.deletedCount } };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ==================== SETTINGS HANDLERS ====================

ipcMain.handle('db:getSettings', async () => {
  try {
    const settings = database.getSettings();
    return { success: true, data: settings };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:updateSettings', async (event, updates) => {
  try {
    database.updateSettings(updates);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ==================== DASHBOARD STATS ====================

ipcMain.handle('db:getDashboardStats', async () => {
  try {
    const stats = database.getDashboardStats();
    return { success: true, data: stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ==================== HISTORY HANDLER ====================

ipcMain.handle('db:getHistory', async (event, startDate, endDate) => {
  try {
    const data = database.getHistoryData(startDate, endDate);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ==================== PREDICTIONS HANDLER ====================

ipcMain.handle('db:getPredictions', async () => {
  try {
    const data = database.getPredictionData();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ==================== CSV EXPORT ====================

ipcMain.handle('export:csv', async (event, data, defaultFileName) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultFileName,
      filters: [
        { name: 'CSV Files', extensions: ['csv'] }
      ]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    fs.writeFileSync(result.filePath, data, 'utf8');
    return { success: true, path: result.filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ==================== APP LIFECYCLE ====================

app.whenReady().then(async () => {
  const dbPath = getDatabasePath();
  console.log('Database path:', dbPath);
  console.log('Config loaded from:', getConfigPath());

  try {
    await database.initDatabase(dbPath);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    dialog.showErrorBox(
      'Database Error',
      `Failed to initialize database.\n\nPath: ${dbPath}\n\nError: ${error.message}`
    );
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  database.closeDb();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
