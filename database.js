const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

let db = null;
let dbPath = null;

// Initialize database with schema
async function initDatabase(filePath) {
  dbPath = filePath;

  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL DEFAULT 'User',
      profileImage TEXT,
      currency TEXT DEFAULT 'EUR',
      masterPasswordHash TEXT,
      setupCompleted INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS income (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      category TEXT,
      provider TEXT,
      icon TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS outgoing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      category TEXT,
      provider TEXT,
      recurring INTEGER DEFAULT 0,
      billingCycle TEXT,
      nextPaymentDate TEXT,
      icon TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS payment_providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      accountNumber TEXT,
      notes TEXT,
      icon TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS image_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      imageKey TEXT UNIQUE NOT NULL,
      data BLOB NOT NULL,
      mimeType TEXT NOT NULL,
      createdAt TEXT
    )
  `);

  // Initialize settings if not exists
  const settings = db.exec('SELECT * FROM settings WHERE id = 1');
  if (settings.length === 0 || settings[0].values.length === 0) {
    const now = new Date().toISOString();
    db.run(`
      INSERT INTO settings (id, name, currency, setupCompleted, createdAt, updatedAt)
      VALUES (1, 'User', 'EUR', 0, ?, ?)
    `, [now, now]);
  }

  saveDatabase();
  return db;
}

// Save database to file
function saveDatabase() {
  if (db && dbPath) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Get database instance
function getDb() {
  return db;
}

// Close database
function closeDb() {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}

// Helper to convert sql.js result to array of objects
function resultToObjects(result) {
  if (!result || result.length === 0) return [];
  const columns = result[0].columns;
  const values = result[0].values;
  return values.map(row => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

// Helper to get single object from result
function resultToObject(result) {
  const objects = resultToObjects(result);
  return objects.length > 0 ? objects[0] : null;
}

// ==================== AUTH FUNCTIONS ====================

function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hashSync(password, saltRounds);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function isFirstRun() {
  const result = db.exec('SELECT setupCompleted FROM settings WHERE id = 1');
  const settings = resultToObject(result);
  return !settings || settings.setupCompleted === 0;
}

function getSettings() {
  const result = db.exec('SELECT * FROM settings WHERE id = 1');
  return resultToObject(result);
}

function completeSetup(name, currency, password, profileImage) {
  const now = new Date().toISOString();
  const passwordHash = hashPassword(password);

  db.run(`
    UPDATE settings
    SET name = ?, currency = ?, masterPasswordHash = ?, profileImage = ?,
        setupCompleted = 1, updatedAt = ?
    WHERE id = 1
  `, [name, currency, passwordHash, profileImage, now]);

  saveDatabase();
}

function updateSettings(updates) {
  const now = new Date().toISOString();
  const settings = getSettings();

  const newName = updates.name !== undefined ? updates.name : settings.name;
  const newCurrency = updates.currency !== undefined ? updates.currency : settings.currency;
  const newProfileImage = updates.profileImage !== undefined ? updates.profileImage : settings.profileImage;

  db.run(`
    UPDATE settings
    SET name = ?, currency = ?, profileImage = ?, updatedAt = ?
    WHERE id = 1
  `, [newName, newCurrency, newProfileImage, now]);

  saveDatabase();
}

// ==================== CRUD FUNCTIONS ====================

function getAll(tableName) {
  const validTables = ['income', 'outgoing', 'payment_providers'];
  if (!validTables.includes(tableName)) {
    throw new Error('Invalid table name');
  }
  const result = db.exec(`SELECT * FROM ${tableName} ORDER BY createdAt DESC`);
  return resultToObjects(result);
}

function getOne(tableName, id) {
  const validTables = ['income', 'outgoing', 'payment_providers'];
  if (!validTables.includes(tableName)) {
    throw new Error('Invalid table name');
  }
  const result = db.exec(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);
  return resultToObject(result);
}

function insert(tableName, data) {
  const validTables = ['income', 'outgoing', 'payment_providers'];
  if (!validTables.includes(tableName)) {
    throw new Error('Invalid table name');
  }

  const now = new Date().toISOString();
  data.createdAt = now;
  data.updatedAt = now;

  const columns = Object.keys(data);
  const placeholders = columns.map(() => '?').join(', ');
  const values = columns.map(col => data[col]);

  db.run(`
    INSERT INTO ${tableName} (${columns.join(', ')})
    VALUES (${placeholders})
  `, values);

  // Get last insert ID
  const result = db.exec('SELECT last_insert_rowid() as id');
  const insertedId = resultToObject(result)?.id;

  saveDatabase();
  return { insertedId };
}

function update(tableName, id, data) {
  const validTables = ['income', 'outgoing', 'payment_providers'];
  if (!validTables.includes(tableName)) {
    throw new Error('Invalid table name');
  }

  const now = new Date().toISOString();
  data.updatedAt = now;

  const setClauses = Object.keys(data).map(col => `${col} = ?`).join(', ');
  const values = [...Object.values(data), id];

  db.run(`
    UPDATE ${tableName} SET ${setClauses} WHERE id = ?
  `, values);

  saveDatabase();
  return { modifiedCount: db.getRowsModified() };
}

function deleteOne(tableName, id) {
  const validTables = ['income', 'outgoing', 'payment_providers'];
  if (!validTables.includes(tableName)) {
    throw new Error('Invalid table name');
  }

  db.run(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
  const deletedCount = db.getRowsModified();

  saveDatabase();
  return { deletedCount };
}

// ==================== DASHBOARD STATS ====================

function getDashboardStats() {
  // Total income
  const incomeResult = db.exec('SELECT COALESCE(SUM(amount), 0) as total FROM income');
  const incomeTotal = resultToObject(incomeResult)?.total || 0;

  // Total outgoing
  const outgoingResult = db.exec('SELECT COALESCE(SUM(amount), 0) as total FROM outgoing');
  const outgoingTotal = resultToObject(outgoingResult)?.total || 0;

  // Recent income (last 5)
  const recentIncomeResult = db.exec('SELECT * FROM income ORDER BY createdAt DESC LIMIT 5');
  const recentIncome = resultToObjects(recentIncomeResult);

  // Recent outgoing (last 5)
  const recentOutgoingResult = db.exec('SELECT * FROM outgoing ORDER BY createdAt DESC LIMIT 5');
  const recentOutgoing = resultToObjects(recentOutgoingResult);

  // Monthly income for current year
  const currentYear = new Date().getFullYear().toString();
  const monthlyIncomeResult = db.exec(`
    SELECT substr(date, 1, 7) as _id, SUM(amount) as total
    FROM income
    WHERE substr(date, 1, 4) = ?
    GROUP BY substr(date, 1, 7)
    ORDER BY _id ASC
  `, [currentYear]);
  const monthlyIncome = resultToObjects(monthlyIncomeResult);

  // Monthly outgoing for current year
  const monthlyOutgoingResult = db.exec(`
    SELECT substr(date, 1, 7) as _id, SUM(amount) as total
    FROM outgoing
    WHERE substr(date, 1, 4) = ?
    GROUP BY substr(date, 1, 7)
    ORDER BY _id ASC
  `, [currentYear]);
  const monthlyOutgoing = resultToObjects(monthlyOutgoingResult);

  return {
    totalIncome: incomeTotal,
    totalOutgoing: outgoingTotal,
    balance: incomeTotal - outgoingTotal,
    recentIncome,
    recentOutgoing,
    monthlyIncome,
    monthlyOutgoing
  };
}

// ==================== HISTORY FUNCTIONS ====================

function getHistoryData(startDate, endDate) {
  const incomeResult = db.exec(`
    SELECT * FROM income
    WHERE date BETWEEN ? AND ?
    ORDER BY date DESC
  `, [startDate, endDate]);
  const income = resultToObjects(incomeResult);

  const outgoingResult = db.exec(`
    SELECT * FROM outgoing
    WHERE date BETWEEN ? AND ?
    ORDER BY date DESC
  `, [startDate, endDate]);
  const outgoing = resultToObjects(outgoingResult);

  const incomeTotalResult = db.exec(`
    SELECT COALESCE(SUM(amount), 0) as total FROM income
    WHERE date BETWEEN ? AND ?
  `, [startDate, endDate]);
  const incomeTotal = resultToObject(incomeTotalResult)?.total || 0;

  const outgoingTotalResult = db.exec(`
    SELECT COALESCE(SUM(amount), 0) as total FROM outgoing
    WHERE date BETWEEN ? AND ?
  `, [startDate, endDate]);
  const outgoingTotal = resultToObject(outgoingTotalResult)?.total || 0;

  const categoryResult = db.exec(`
    SELECT category, SUM(amount) as total
    FROM outgoing
    WHERE date BETWEEN ? AND ?
    GROUP BY category
    ORDER BY total DESC
  `, [startDate, endDate]);
  const categoryBreakdown = resultToObjects(categoryResult);

  return {
    income,
    outgoing,
    incomeTotal,
    outgoingTotal,
    net: incomeTotal - outgoingTotal,
    categoryBreakdown
  };
}

// ==================== PREDICTIONS FUNCTIONS ====================

function getPredictionData() {
  // Get all subscriptions (recurring items)
  const subscriptionsResult = db.exec(`
    SELECT * FROM outgoing
    WHERE recurring = 1
    ORDER BY nextPaymentDate ASC
  `);
  const subscriptions = resultToObjects(subscriptionsResult);

  // Calculate averages
  const avgIncomeResult = db.exec(`
    SELECT AVG(monthly_total) as avg FROM (
      SELECT SUM(amount) as monthly_total
      FROM income
      GROUP BY substr(date, 1, 7)
    )
  `);
  const avgMonthlyIncome = resultToObject(avgIncomeResult)?.avg || 0;

  const avgOutgoingResult = db.exec(`
    SELECT AVG(monthly_total) as avg FROM (
      SELECT SUM(amount) as monthly_total
      FROM outgoing
      GROUP BY substr(date, 1, 7)
    )
  `);
  const avgMonthlyOutgoing = resultToObject(avgOutgoingResult)?.avg || 0;

  // Category trends (last 3 months vs previous 3 months)
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0];
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().split('T')[0];

  const recentCatResult = db.exec(`
    SELECT category, SUM(amount) as total
    FROM outgoing
    WHERE date >= ?
    GROUP BY category
  `, [threeMonthsAgo]);
  const recentCategories = resultToObjects(recentCatResult);

  const prevCatResult = db.exec(`
    SELECT category, SUM(amount) as total
    FROM outgoing
    WHERE date >= ? AND date < ?
    GROUP BY category
  `, [sixMonthsAgo, threeMonthsAgo]);
  const previousCategories = resultToObjects(prevCatResult);

  // Current balance
  const balanceResult = db.exec(`
    SELECT
      (SELECT COALESCE(SUM(amount), 0) FROM income) -
      (SELECT COALESCE(SUM(amount), 0) FROM outgoing) as balance
  `);
  const currentBalance = resultToObject(balanceResult)?.balance || 0;

  // Subscription total per month
  const subscriptionMonthlyTotal = subscriptions
    .filter(s => s.billingCycle === 'monthly')
    .reduce((sum, s) => sum + (s.amount || 0), 0);

  return {
    subscriptions,
    avgMonthlyIncome,
    avgMonthlyOutgoing,
    recentCategories,
    previousCategories,
    currentBalance,
    subscriptionMonthlyTotal
  };
}

// ==================== IMAGE CACHE FUNCTIONS ====================

function saveImage(imageKey, data, mimeType) {
  const now = new Date().toISOString();

  // Check if image already exists
  const existing = db.exec('SELECT id FROM image_cache WHERE imageKey = ?', [imageKey]);
  const existingObj = resultToObject(existing);

  if (existingObj) {
    db.run(`
      UPDATE image_cache SET data = ?, mimeType = ? WHERE imageKey = ?
    `, [data, mimeType, imageKey]);
    saveDatabase();
    return existingObj.id;
  } else {
    db.run(`
      INSERT INTO image_cache (imageKey, data, mimeType, createdAt)
      VALUES (?, ?, ?, ?)
    `, [imageKey, data, mimeType, now]);

    const result = db.exec('SELECT last_insert_rowid() as id');
    const insertedId = resultToObject(result)?.id;

    saveDatabase();
    return insertedId;
  }
}

function getImage(imageKey) {
  const result = db.exec('SELECT * FROM image_cache WHERE imageKey = ?', [imageKey]);
  return resultToObject(result);
}

function deleteImage(imageKey) {
  db.run('DELETE FROM image_cache WHERE imageKey = ?', [imageKey]);
  const deletedCount = db.getRowsModified();
  saveDatabase();
  return { deletedCount };
}

module.exports = {
  initDatabase,
  getDb,
  closeDb,
  saveDatabase,
  // Auth
  hashPassword,
  verifyPassword,
  isFirstRun,
  getSettings,
  completeSetup,
  updateSettings,
  // CRUD
  getAll,
  getOne,
  insert,
  update,
  deleteOne,
  // Dashboard
  getDashboardStats,
  // History
  getHistoryData,
  // Predictions
  getPredictionData,
  // Images
  saveImage,
  getImage,
  deleteImage
};
