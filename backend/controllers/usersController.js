const { getDB } = require('../db');
const bcrypt = require('bcryptjs');

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const db = await getDB();
    let query = `SELECT id, name, email, role, created_at FROM users`;
    const params = [];

    if (search) {
      query += ` WHERE name LIKE ? OR email LIKE ?`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const users = await db.all(query, params);
    const totalCount = await db.get('SELECT COUNT(*) as count FROM users');

    res.json({
      users,
      totalPages: Math.ceil(totalCount.count / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    console.error('Error getting users:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const db = await getDB();

    // Get user info
    const user = await db.get(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get borrow history
    const borrowHistory = await db.all(
      `SELECT 
        br.*,
        b.title as book_title,
        b.author as book_author,
        b.isbn as book_isbn
       FROM borrow_records br
       JOIN books b ON br.book_id = b.id
       WHERE br.user_id = ?
       ORDER BY br.borrow_date DESC`,
      [userId]
    );

    // Get active fines
    const fines = await db.all(
      'SELECT * FROM fines WHERE user_id = ? AND status = ?',
      [userId, 'unpaid']
    );

    res.json({
      user,
      borrowHistory,
      fines
    });
  } catch (err) {
    console.error('Error getting profile:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, currentPassword, newPassword } = req.body;
    const db = await getDB();

    // Get current user data
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If updating email, check it's not taken
    if (email && email !== user.email) {
      const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // If updating password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedPassword;
    }

    // Update user
    await db.run(
      `UPDATE users SET 
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        password = COALESCE(?, password)
       WHERE id = ?`,
      [name, email, user.password, userId]
    );

    // Get updated user data (excluding password)
    const updatedUser = await db.get(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};
