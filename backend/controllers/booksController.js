const { getDB } = require("../db");

// Get all books
exports.getAllBooks = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', filter = '' } = req.query;
    const offset = (page - 1) * limit;
    
    const db = await getDB();
    let query = "SELECT * FROM books";
    const params = [];
    
    if (search) {
      query += " WHERE title LIKE ? OR author LIKE ? OR isbn LIKE ?";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    query += " LIMIT ? OFFSET ?";
    params.push(limit, offset);
    
    const books = await db.all(query, params);
    const totalCount = await db.get("SELECT COUNT(*) as count FROM books");
    
    res.json({
      books,
      totalPages: Math.ceil(totalCount.count / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    console.error("Error fetching books:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Create a new book
exports.createBook = async (req, res) => {
  const { title, author, isbn, quantity = 1, category = 'uncategorized' } = req.body;

  if (!title || !author || !isbn) {
    return res.status(400).json({ message: "Title, author, and ISBN are required" });
  }

  try {
    const db = await getDB();
    
    // Check if book with ISBN already exists
    const existingBook = await db.get("SELECT * FROM books WHERE isbn = ?", [isbn]);
    if (existingBook) {
      return res.status(400).json({ message: "A book with this ISBN already exists" });
    }

    const result = await db.run(
      "INSERT INTO books (title, author, isbn, quantity, category, status) VALUES (?, ?, ?, ?, ?, ?)",
      [title, author, isbn, quantity, category, 'available']
    );

    res.status(201).json({
      id: result.lastID,
      title,
      author,
      isbn,
      quantity,
      category,
      status: 'available'
    });
  } catch (err) {
    console.error("Error creating book:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get a single book by ID
exports.getBookById = async (req, res) => {
  const { id } = req.params;
  try {
    const db = await getDB();
    const book = await db.get("SELECT * FROM books WHERE id = ?", [id]);
    
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Get current reservations for this book
    const reservations = await db.all(
      "SELECT * FROM reservations WHERE book_id = ? AND status = 'pending' ORDER BY created_at ASC",
      [id]
    );

    res.json({
      ...book,
      reservations: reservations.length > 0 ? reservations : []
    });
  } catch (err) {
    console.error("Error fetching book:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Update a book by ID
exports.updateBook = async (req, res) => {
  const { id } = req.params;
  const { title, author, isbn, quantity, category, status } = req.body;

  try {
    const db = await getDB();
    
    // Check if book exists
    const book = await db.get("SELECT * FROM books WHERE id = ?", [id]);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // If updating ISBN, check it doesn't conflict with other books
    if (isbn && isbn !== book.isbn) {
      const existingBook = await db.get("SELECT * FROM books WHERE isbn = ? AND id != ?", [isbn, id]);
      if (existingBook) {
        return res.status(400).json({ message: "A book with this ISBN already exists" });
      }
    }

    const result = await db.run(
      `UPDATE books SET 
        title = COALESCE(?, title),
        author = COALESCE(?, author),
        isbn = COALESCE(?, isbn),
        quantity = COALESCE(?, quantity),
        category = COALESCE(?, category),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [title, author, isbn, quantity, category, status, id]
    );

    if (result.changes === 0) {
      return res.status(400).json({ message: "No changes made to the book" });
    }

    const updatedBook = await db.get("SELECT * FROM books WHERE id = ?", [id]);
    res.json(updatedBook);
  } catch (err) {
    console.error("Error updating book:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Delete a book by ID
exports.deleteBook = async (req, res) => {
  const { id } = req.params;

  try {
    const db = await getDB();
    
    // Check for active loans or reservations
    const activeLoans = await db.get(
      "SELECT COUNT(*) as count FROM borrow_records WHERE book_id = ? AND return_date IS NULL",
      [id]
    );

    const activeReservations = await db.get(
      "SELECT COUNT(*) as count FROM reservations WHERE book_id = ? AND status = 'pending'",
      [id]
    );

    if (activeLoans.count > 0 || activeReservations.count > 0) {
      return res.status(400).json({ 
        message: "Cannot delete book with active loans or reservations" 
      });
    }

    const result = await db.run("DELETE FROM books WHERE id = ?", [id]);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    console.error("Error deleting book:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Borrow a book
exports.borrowBook = async (req, res) => {
  const { id: bookId } = req.params;
  const userId = req.user.id;

  try {
    const db = await getDB();

    // Start a transaction
    await db.run('BEGIN TRANSACTION');

    try {
      // Check if book exists and is available
      const book = await db.get(
        "SELECT * FROM books WHERE id = ? AND status = 'available' AND quantity > 0",
        [bookId]
      );

      if (!book) {
        await db.run('ROLLBACK');
        return res.status(400).json({ message: "Book not available for borrowing" });
      }

      // Check if user has any overdue books
      const overdueBooks = await db.get(
        `SELECT COUNT(*) as count FROM borrow_records 
         WHERE user_id = ? AND return_date IS NULL AND due_date < datetime('now')`,
        [userId]
      );

      if (overdueBooks.count > 0) {
        await db.run('ROLLBACK');
        return res.status(400).json({ message: "Cannot borrow - you have overdue books" });
      }

      // Create borrow record
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14); // 2 weeks loan period

      await db.run(
        `INSERT INTO borrow_records (user_id, book_id, borrow_date, due_date) 
         VALUES (?, ?, datetime('now'), datetime(?))`,
        [userId, bookId, dueDate.toISOString()]
      );

      // Update book quantity and status
      await db.run(
        `UPDATE books SET 
         quantity = quantity - 1,
         status = CASE WHEN quantity - 1 = 0 THEN 'borrowed' ELSE status END
         WHERE id = ?`,
        [bookId]
      );

      await db.run('COMMIT');

      res.json({ message: "Book borrowed successfully", dueDate });
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (err) {
    console.error("Error borrowing book:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Return a book
exports.returnBook = async (req, res) => {
  const { id: bookId } = req.params;
  const userId = req.user.id;

  try {
    const db = await getDB();

    await db.run('BEGIN TRANSACTION');

    try {
      // Find the borrow record
      const borrowRecord = await db.get(
        `SELECT * FROM borrow_records 
         WHERE book_id = ? AND user_id = ? AND return_date IS NULL`,
        [bookId, userId]
      );

      if (!borrowRecord) {
        await db.run('ROLLBACK');
        return res.status(400).json({ message: "No active borrow record found" });
      }

      // Update borrow record
      await db.run(
        `UPDATE borrow_records SET return_date = datetime('now')
         WHERE id = ?`,
        [borrowRecord.id]
      );

      // Update book
      await db.run(
        `UPDATE books SET 
         quantity = quantity + 1,
         status = 'available'
         WHERE id = ?`,
        [bookId]
      );

      // Check for overdue and create fine if necessary
      if (new Date(borrowRecord.due_date) < new Date()) {
        const daysOverdue = Math.ceil(
          (new Date() - new Date(borrowRecord.due_date)) / (1000 * 60 * 60 * 24)
        );
        const fineAmount = daysOverdue * 1; // $1 per day

        await db.run(
          `INSERT INTO fines (user_id, borrow_record_id, amount, status)
           VALUES (?, ?, ?, 'unpaid')`,
          [userId, borrowRecord.id, fineAmount]
        );
      }

      await db.run('COMMIT');

      res.json({ message: "Book returned successfully" });
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (err) {
    console.error("Error returning book:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get book recommendations
exports.getRecommendations = async (req, res) => {
  const userId = req.user.id;

  try {
    const db = await getDB();

    // Get user's reading history categories
    const userCategories = await db.all(
      `SELECT DISTINCT b.category 
       FROM borrow_records br
       JOIN books b ON br.book_id = b.id
       WHERE br.user_id = ?
       ORDER BY br.borrow_date DESC
       LIMIT 3`,
      [userId]
    );

    let recommendations = [];

    if (userCategories.length > 0) {
      // Get recommendations based on user's reading history
      const categories = userCategories.map(c => c.category);
      recommendations = await db.all(
        `SELECT * FROM books 
         WHERE category IN (${categories.map(() => '?').join(',')})
         AND status = 'available'
         AND id NOT IN (
           SELECT book_id FROM borrow_records WHERE user_id = ?
         )
         ORDER BY RANDOM()
         LIMIT 10`,
        [...categories, userId]
      );
    }

    // If not enough recommendations, add popular books
    if (recommendations.length < 10) {
      const popularBooks = await db.all(
        `SELECT b.*, COUNT(br.id) as borrow_count 
         FROM books b
         LEFT JOIN borrow_records br ON b.id = br.book_id
         WHERE b.status = 'available'
         AND b.id NOT IN (${recommendations.map(r => r.id).join(',') || 0})
         GROUP BY b.id
         ORDER BY borrow_count DESC
         LIMIT ?`,
        [10 - recommendations.length]
      );

      recommendations = [...recommendations, ...popularBooks];
    }

    res.json(recommendations);
  } catch (err) {
    console.error("Error getting recommendations:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
