const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

(async ()=>{
  try{
    const db = await open({ filename: path.join(__dirname,'..','library.db'), driver: sqlite3.Database });
    const books = await db.all('SELECT * FROM books');
    const reservations = await db.all('SELECT * FROM reservations');
    const borrow = await db.all('SELECT * FROM borrow_records');
    console.log('books:', books);
    console.log('reservations:', reservations);
    console.log('borrow_records:', borrow);
    process.exit(0);
  }catch(e){ console.error(e); process.exit(1); }
})();