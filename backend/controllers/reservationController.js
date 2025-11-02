const { getDB } = require('../db');

const createReservation = async (req, res) => {
  try {
    console.log('Creating reservation with req:', { 
      body: req.body,
      user: req.user,
      headers: req.headers
    });

    const { bookId } = req.body;
    if (!bookId) {
      return res.status(400).json({ message: 'bookId is required' });
    }
    
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const userId = req.user.id;

    const db = await getDB();

    // Check if book exists
    const book = await db.get('SELECT id, quantity FROM books WHERE id = ?', [bookId]);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Check if user already has an active reservation for this book
    const existing = await db.get(
      'SELECT * FROM reservations WHERE user_id = ? AND book_id = ? AND status = ?',
      [userId, bookId, 'pending']
    );
    if (existing) {
      return res.status(400).json({ message: 'You already have a pending reservation for this book' });
    }

    // Insert with required fields from the schema
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 7); // Default 7-day reservation

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    
    console.log('Creating reservation:', { userId, bookId, startStr, endStr });

    // Run insert and use the returned lastID from the sqlite run result
    const result = await db.run(
      'INSERT INTO reservations (user_id, book_id, start_date, end_date, duration, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, bookId, startStr, endStr, 7, 'pending']
    );
    console.log('Insert result:', result);

    // Check if insert happened
    if (!result?.changes) {
      throw new Error('Insert failed - no rows affected');
    }

    // Normalize the inserted id returned by the sqlite driver. Some drivers
    // provide `lastID` while others might use different casing. Keep a
    // fallback to last_insert_rowid() and ensure the local variable is
    // declared so we never reference an undeclared identifier.
    const insertedId = result.lastID || result.lastid || null;
    let reservationId = null;
    if (!insertedId) {
      // Fallback: try last_insert_rowid() if the driver didn't return lastID
      const fallback = await db.get('SELECT last_insert_rowid() as id');
      if (!fallback?.id) throw new Error('Failed to get last insert id');
      reservationId = fallback.id;
    }

    const idToUse = insertedId || reservationId;
    const reservation = await db.get('SELECT * FROM reservations WHERE id = ?', [idToUse]);
    if (!reservation) {
      throw new Error('Failed to retrieve inserted reservation');
    }

    console.log('Retrieved reservation:', reservation);
    res.status(201).json({ message: 'Reservation created', reservation });
  } catch (err) {
    console.error('Error creating reservation:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

const getReservations = async (req, res) => {
  try {
    console.log('Getting reservations for user:', req.user);
    const db = await getDB();
    const userId = req.user.id;

    let query;
    let params = [];

    if (req.user.role === 'admin') {
      query = `
        SELECT 
          r.*,
          u.name as user_name,
          b.title as book_title,
          b.author as book_author,
          b.quantity,
          b.available_quantity
        FROM reservations r
        INNER JOIN users u ON r.user_id = u.id
        INNER JOIN books b ON r.book_id = b.id
        ORDER BY r.created_at DESC
      `;
    } else {
      query = `
        SELECT 
          r.*,
          b.title as book_title,
          b.author as book_author,
          b.quantity,
          b.available_quantity
        FROM reservations r
        INNER JOIN books b ON r.book_id = b.id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
      `;
      params = [userId];
    }

    const reservations = await db.all(query, params);
    
    if (!reservations || reservations.length === 0) {
      return res.json({ message: 'No reservations found', reservations: [] });
    }

    res.json({ message: 'Reservations found', reservations });

  } catch (err) {
    console.error('Error getting reservations:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDB();

    const reservation = await db.get('SELECT * FROM reservations WHERE id = ?', [id]);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

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

const getReservationQueue = async (req, res) => {
  try {
    const { id: bookId } = req.params;
    const db = await getDB();

    const rows = await db.all(
      `SELECT r.id, r.status, u.id as user_id, u.name as user_name, u.email as user_email, r.created_at
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       WHERE r.book_id = ? AND r.status = 'pending'
       ORDER BY r.created_at ASC`,
      [bookId]
    );

    const withPosition = rows.map((r, idx) => ({ ...r, position: idx + 1 }));
    res.json({ queue: withPosition });
  } catch (err) {
    console.error('Error getting reservation queue:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

const checkReservationAvailability = async (req, res) => {
  try {
    const { id: bookId } = req.params;
    const db = await getDB();

    const book = await db.get('SELECT quantity FROM books WHERE id = ?', [bookId]);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const borrowedRow = await db.get(
      'SELECT COUNT(*) as count FROM borrow_records WHERE book_id = ? AND return_date IS NULL', 
      [bookId]
    );
    const borrowedCount = borrowedRow.count || 0;
    const available = Math.max((book.quantity || 0) - borrowedCount, 0);

    const pendingRow = await db.get(
      'SELECT COUNT(*) as count FROM reservations WHERE book_id = ? AND status = ?', 
      [bookId, 'pending']
    );
    const pendingCount = pendingRow.count || 0;

    res.json({
      available,
      pending: pendingCount,
      canReserve: available - pendingCount > 0
    });
  } catch (err) {
    console.error('Error checking reservation availability:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  createReservation,
  getReservations,
  cancelReservation,
  getReservationQueue,
  checkReservationAvailability
};