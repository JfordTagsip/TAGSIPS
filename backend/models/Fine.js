const db = require('../db');

class Fine {
  static async create(fineData) {
    const [result] = await db.execute(
      'INSERT INTO fines (user_id, borrow_record_id, days_overdue, amount) VALUES (?, ?, ?, ?)',
      [fineData.userId, fineData.borrowRecordId, fineData.daysOverdue, fineData.amount]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.execute(
      'SELECT * FROM fines WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async findByUser(userId) {
    const [rows] = await db.execute(
      `SELECT f.*, b.title as book_title, br.due_date
       FROM fines f
       JOIN borrow_records br ON f.borrow_record_id = br.id
       JOIN books b ON br.book_id = b.id
       WHERE f.user_id = ? AND f.paid = false`,
      [userId]
    );
    return rows;
  }

  static async updatePayment(id, amount) {
    const [result] = await db.execute(
      'UPDATE fines SET paid = true, paid_amount = ?, paid_at = CURRENT_TIMESTAMP WHERE id = ?',
      [amount, id]
    );
    return result.affectedRows > 0;
  }

  static async getFineHistory(userId) {
    const [rows] = await db.execute(
      `SELECT f.*, b.title as book_title
       FROM fines f
       JOIN borrow_records br ON f.borrow_record_id = br.id
       JOIN books b ON br.book_id = b.id
       WHERE f.user_id = ? AND f.paid = true
       ORDER BY f.paid_at DESC`,
      [userId]
    );
    return rows;
  }
}

module.exports = Fine;