const db = require('../db');

class Reservation {
  static async create(reservationData) {
    const [result] = await db.execute(
      'INSERT INTO reservations (user_id, book_id, start_date, end_date, duration) VALUES (?, ?, ?, ?, ?)',
      [
        reservationData.userId,
        reservationData.bookId,
        reservationData.startDate,
        reservationData.endDate,
        reservationData.duration
      ]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT r.*, b.title as book_title
       FROM reservations r
       JOIN books b ON r.book_id = b.id
       WHERE r.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async findByUser(userId) {
    const [rows] = await db.execute(
      `SELECT r.*, b.title as book_title
       FROM reservations r
       JOIN books b ON r.book_id = b.id
       WHERE r.user_id = ? AND r.status IN ('pending', 'confirmed')
       ORDER BY r.created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async getReservationHistory(userId) {
    const [rows] = await db.execute(
      `SELECT r.*, b.title as book_title
       FROM reservations r
       JOIN books b ON r.book_id = b.id
       WHERE r.user_id = ? AND r.status IN ('completed', 'cancelled')
       ORDER BY r.updated_at DESC`,
      [userId]
    );
    return rows;
  }

  static async getQueuePosition(bookId) {
    const [rows] = await db.execute(
      'SELECT COUNT(*) as position FROM reservations WHERE book_id = ? AND status = "pending"',
      [bookId]
    );
    return rows[0].position;
  }

  static async cancel(id, userId) {
    const [result] = await db.execute(
      'UPDATE reservations SET status = "cancelled" WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  static async updateQueuePositions(bookId) {
    const [rows] = await db.execute(
      `SELECT id FROM reservations
       WHERE book_id = ? AND status = "pending"
       ORDER BY created_at ASC`,
      [bookId]
    );

    for (let i = 0; i < rows.length; i++) {
      await db.execute(
        'UPDATE reservations SET queue_position = ? WHERE id = ?',
        [i + 1, rows[i].id]
      );
    }
  }

  static async checkAvailability(bookId, startDate) {
    const [rows] = await db.execute(
      `SELECT * FROM reservations
       WHERE book_id = ?
       AND status IN ('pending', 'confirmed')
       AND start_date <= ?
       AND end_date >= ?`,
      [bookId, startDate, startDate]
    );
    return rows.length === 0;
  }
}

module.exports = Reservation;