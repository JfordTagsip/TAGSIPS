const bcrypt = require('bcryptjs');
const { getDB } = require('../db');

(async () => {
  try {
    const db = await getDB();

    // Create admin user if not exists
    const adminEmail = 'admin@demo.local';
    const existingAdmin = await db.get('SELECT * FROM users WHERE email = ?', [adminEmail]);
    if (!existingAdmin) {
      const hashed = await bcrypt.hash('AdminPass123!', 10);
      const r = await db.run(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Demo Admin', adminEmail, hashed, 'admin']
      );
      console.log('Created admin user with id', r.lastID);
    } else {
      console.log('Admin user already exists with id', existingAdmin.id);
    }

    // Seed some books
    const books = [
      { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '9780743273565', category: 'Fiction', quantity: 3 },
      { title: '1984', author: 'George Orwell', isbn: '9780451524935', category: 'Dystopia', quantity: 4 },
      { title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', category: 'Programming', quantity: 2 },
    ];

    for (const b of books) {
      const exists = await db.get('SELECT * FROM books WHERE isbn = ?', [b.isbn]);
      if (!exists) {
        const res = await db.run(
          'INSERT INTO books (title, author, isbn, category, quantity) VALUES (?, ?, ?, ?, ?)',
          [b.title, b.author, b.isbn, b.category, b.quantity]
        );
        console.log('Inserted book', b.title, 'id', res.lastID);
      } else {
        console.log('Book already exists:', b.title);
      }
    }

    // Add a few demo users for reservations/borrowing
    const demoUsers = [
      { name: 'Alice Demo', email: 'alice@demo.local' },
      { name: 'Bob Demo', email: 'bob@demo.local' },
      { name: 'Carol Demo', email: 'carol@demo.local' }
    ];

    for (const u of demoUsers) {
      const exists = await db.get('SELECT * FROM users WHERE email = ?', [u.email]);
      if (!exists) {
        const hashed = await bcrypt.hash('Password123!', 10);
        const r = await db.run(
          'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          [u.name, u.email, hashed, 'user']
        );
        console.log('Created demo user', u.email, 'id', r.lastID);
      } else {
        console.log('Demo user already exists:', u.email);
      }
    }

    // Create borrow_records and reservations to showcase queue/availability
    // Find book ids by ISBN
    const cleanCode = await db.get('SELECT id FROM books WHERE isbn = ?', ['9780132350884']);
    const gatsby = await db.get('SELECT id FROM books WHERE isbn = ?', ['9780743273565']);
    const nineteenEightyFour = await db.get('SELECT id FROM books WHERE isbn = ?', ['9780451524935']);

    // Get demo user ids
    const alice = await db.get('SELECT id FROM users WHERE email = ?', ['alice@demo.local']);
    const bob = await db.get('SELECT id FROM users WHERE email = ?', ['bob@demo.local']);
    const carol = await db.get('SELECT id FROM users WHERE email = ?', ['carol@demo.local']);

    // If Clean Code exists, create a borrow record (returned = null) to reduce availability
    if (cleanCode && alice) {
      const existingBorrow = await db.get(
        'SELECT * FROM borrow_records WHERE user_id = ? AND book_id = ? AND return_date IS NULL',
        [alice.id, cleanCode.id]
      );
      if (!existingBorrow) {
        const now = new Date();
        const due = new Date();
        due.setDate(due.getDate() + 14);
        await db.run(
          'INSERT INTO borrow_records (user_id, book_id, borrow_date, due_date, return_date) VALUES (?, ?, ?, ?, ?)',
          [alice.id, cleanCode.id, now.toISOString(), due.toISOString(), null]
        );
        console.log('Created borrow_record for alice on Clean Code');
      } else {
        console.log('Borrow record already exists for alice on Clean Code');
      }
    }

    // Create a small reservation queue for "Clean Code" and "The Great Gatsby"
    const makeReservationIfMissing = async (userId, bookId, daysOffset = 0) => {
      if (!userId || !bookId) return;
      // Use created_at override for ordering
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysOffset);
      const exists = await db.get(
        'SELECT * FROM reservations WHERE user_id = ? AND book_id = ? AND status = ?',
        [userId, bookId, 'pending']
      );
      if (!exists) {
        const start = new Date(createdAt);
        const end = new Date(start);
        const duration = 7;
        end.setDate(end.getDate() + duration);
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];
        await db.run(
          'INSERT INTO reservations (user_id, book_id, start_date, end_date, duration, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [userId, bookId, startStr, endStr, duration, 'pending', createdAt.toISOString()]
        );
        console.log('Inserted reservation for user', userId, 'book', bookId);
      } else {
        console.log('Reservation already exists for user', userId, 'book', bookId);
      }
    };

    if (cleanCode && bob && carol) {
      // Bob reserved earlier, Carol later to simulate queue
      await makeReservationIfMissing(bob.id, cleanCode.id, 3);
      await makeReservationIfMissing(carol.id, cleanCode.id, 1);
    }

    if (gatsby && bob) {
      await makeReservationIfMissing(bob.id, gatsby.id, 2);
    }

    console.log('Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed', err);
    process.exit(1);
  }
})();
