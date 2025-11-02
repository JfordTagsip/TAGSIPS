const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'library.db');

let db = null;

const initializeDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log('✅ Database Connected Successfully');
    return db;
  } catch (err) {
    console.error('❌ Error connecting to the database:', err);
    throw err;
  }
};

module.exports = {
  getDB: async () => {
    if (!db) {
      return await initializeDB();
    }
    return db;
  }
};