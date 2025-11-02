const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

(async () => {
  try {
    const db = await open({ filename: path.join(__dirname, '..', 'library.db'), driver: sqlite3.Database });
    const info = await db.all("PRAGMA table_info('reservations')");
    const createSql = await db.get("SELECT sql FROM sqlite_master WHERE tbl_name='reservations' AND type='table'");
    console.log('table_info:', info);
    console.log('create_sql:', createSql);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
