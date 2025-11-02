const { getDB } = require('../db');

// Create a reservation
exports.createReservation = async (req, res) => {
  try {
    const { bookId, startDate, endDate } = req.body;
    const userId = req.user.id;

    if (!bookId) return res.status(400).json({ message: 'bookId is required' });

    const db = await getDB();

    // Check if book exists
    const book = await db.get('SELECT id, quantity FROM books WHERE id = ?', [bookId]);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    // Check if user already has an active reservation for this book
    const existing = await db.get(
      'SELECT * FROM reservations WHERE user_id = ? AND book_id = ? AND status = ?',
      [userId, bookId, 'pending']
    );
    if (existing) return res.status(400).json({ message: 'You already have a pending reservation for this book' });

    // Insert reservation (queue is by created_at)
    const result = await db.run(
      'INSERT INTO reservations (user_id, book_id, status, created_at) VALUES (?, ?, ?, datetime(\'now\'))',
      [userId, bookId, 'pending']
    );

    const reservation = await db.get('SELECT * FROM reservations WHERE id = ?', [result.lastID]);

    res.status(201).json({ message: 'Reservation created', reservation });
  } catch (err) {
    console.error('Error creating reservation:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get reservations for current user (or all if admin)
exports.getReservations = async (req, res) => {
  try {
    const db = await getDB();
    const userId = req.user.id;

    if (req.user.role === 'admin') {
      const rows = await db.all(
        `SELECT r.*, u.name as user_name, b.title as book_title, b.author as book_author
         FROM reservations r
         JOIN users u ON r.user_id = u.id
         JOIN books b ON r.book_id = b.id
         ORDER BY r.created_at DESC`
      );
      return res.json(rows);
    }

    const rows = await db.all(
      `SELECT r.*, b.title as book_title, b.author as book_author
       FROM reservations r
       JOIN books b ON r.book_id = b.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error getting reservations:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Cancel a reservation (user can cancel their own, admin can cancel any)
exports.cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDB();

    const reservation = await db.get('SELECT * FROM reservations WHERE id = ?', [id]);
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    if (req.user.role !== 'admin' && reservation.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this reservation' });
    }

    await db.run('UPDATE reservations SET status = ? WHERE id = ?', ['cancelled', id]);

    res.json({ message: 'Reservation cancelled' });
  } catch (err) {
    console.error('Error cancelling reservation:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get reservation queue for a book
exports.getReservationQueue = async (req, res) => {
  try {
    const { id: bookId } = req.params;
    const db = await getDB();

    const rows = await db.all(
      `SELECT r.id, r.queue_position, r.status, u.id as user_id, u.name as user_name, u.email as user_email, r.created_at
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       WHERE r.book_id = ? AND r.status = 'pending'
       ORDER BY r.queue_position ASC`,
      [bookId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error getting reservation queue:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Check reservation availability for a book (is there an available copy now?)
exports.checkReservationAvailability = async (req, res) => {
  try {
    const { id: bookId } = req.params;
    const db = await getDB();

    const book = await db.get('SELECT quantity FROM books WHERE id = ?', [bookId]);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    // Count how many are currently borrowed (borrow_records with return_date IS NULL)
    const borrowedRow = await db.get('SELECT COUNT(*) as count FROM borrow_records WHERE book_id = ? AND return_date IS NULL', [bookId]);
    const borrowedCount = borrowedRow.count || 0;

    const available = Math.max((book.quantity || 0) - borrowedCount, 0);

    // Count pending reservations
    const pendingRow = await db.get('SELECT COUNT(*) as count FROM reservations WHERE book_id = ? AND status = ?', [bookId, 'pending']);
    const pendingCount = pendingRow.count || 0;

    res.json({ available, pending: pendingCount, canReserve: available - pendingCount > 0 });
  } catch (err) {
    console.error('Error checking reservation availability:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};
