const db = require('../db'); // I-import ang database connection

// --------------------------------------------------
// 1. GET ALL BOOKS (PUBLIC)
// --------------------------------------------------
exports.getAllBooks = async (req, res) => {
    const sql = "SELECT * FROM books ORDER BY title ASC";
    try {
        const [results] = await db.execute(sql);
        res.status(200).json({ 
            status: 'success',
            results: results.length,
            data: results
        });
    } catch (err) {
        console.error("Error fetching all books:", err);
        res.status(500).json({ 
            status: 'error', 
            message: 'Server error while fetching books.' 
        });
    }
};

// --------------------------------------------------
// 2. GET BOOK BY ID (PUBLIC)
// --------------------------------------------------
exports.getBookById = async (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM books WHERE id = ?";
    try {
        const [results] = await db.execute(sql, [id]);
        if (results.length === 0) {
            return res.status(404).json({ 
                status: 'fail', 
                message: `Book with ID ${id} not found.` 
            });
        }
        res.status(200).json({ 
            status: 'success',
            data: results[0]
        });
    } catch (err) {
        console.error(`Error fetching book ID ${id}:`, err);
        res.status(500).json({ 
            status: 'error', 
            message: 'Server error while fetching book.' 
        });
    }
};

// --------------------------------------------------
// 3. ADD NEW BOOK (PROTECTED: Admin/Librarian)
// --------------------------------------------------
exports.addBook = async (req, res) => {
    // I-adjust kining field names base sa imong 'books' table structure
    const { title, author, isbn, total_copies, genre } = req.body; 

    if (!title || !author || !isbn || !total_copies) {
        return res.status(400).json({ 
            status: 'fail', 
            message: 'Missing required book details (title, author, isbn, total_copies).' 
        });
    }

    const available_copies = total_copies; // Sa sinugdanan, ang tanang kopya available
    
    const sql = `INSERT INTO books (title, author, isbn, total_copies, available_copies, genre) 
                 VALUES (?, ?, ?, ?, ?, ?)`;

    try {
        const [result] = await db.execute(sql, [title, author, isbn, total_copies, available_copies, genre]);
        
        res.status(201).json({ 
            status: 'success', 
            message: 'Book added successfully.',
            bookId: result.insertId 
        });
    } catch (err) {
        console.error("Error adding book:", err);
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ 
                status: 'fail', 
                message: 'A book with this ISBN already exists.' 
            });
        }
        res.status(500).json({ 
            status: 'error', 
            message: 'Server error while adding book.' 
        });
    }
};


// --------------------------------------------------
// 4. UPDATE BOOK (PROTECTED: Admin/Librarian)
// --------------------------------------------------
exports.updateBook = async (req, res) => {
    const { id } = req.params;
    const { title, author, isbn, total_copies, genre } = req.body;
    
    // I-build ang query base sa unsa nga fields ang gi-update
    let updateFields = [];
    let updateValues = [];

    if (title) { updateFields.push('title = ?'); updateValues.push(title); }
    if (author) { updateFields.push('author = ?'); updateValues.push(author); }
    if (isbn) { updateFields.push('isbn = ?'); updateValues.push(isbn); }
    if (genre) { updateFields.push('genre = ?'); updateValues.push(genre); }

    // Dili namo i-update ang total_copies direkta sa yano nga paagi, kinahanglan nato og logic
    // Apan para sa karon, atong i-assume nga ang available_copies dili maapektohan gawas lang kung ang
    // total_copies ang gi-update.
    if (total_copies !== undefined) {
        updateFields.push('total_copies = ?'); 
        updateValues.push(total_copies);
        // NOTE: Ang available_copies kinahanglan i-adjust base sa bag-ong total_copies
        // Apan, magpadayon ta sa yano nga update lang sa total_copies.
    }
    
    if (updateFields.length === 0) {
        return res.status(400).json({ 
            status: 'fail', 
            message: 'No valid fields provided for update.' 
        });
    }

    const sql = `UPDATE books SET ${updateFields.join(', ')} WHERE id = ?`;
    updateValues.push(id);

    try {
        const [result] = await db.execute(sql, updateValues);

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                status: 'fail', 
                message: `Book with ID ${id} not found.` 
            });
        }
        
        res.status(200).json({ 
            status: 'success', 
            message: `Book ID ${id} updated successfully.` 
        });

    } catch (err) {
        console.error(`Error updating book ID ${id}:`, err);
        res.status(500).json({ 
            status: 'error', 
            message: 'Server error while updating book.' 
        });
    }
};

// --------------------------------------------------
// 5. DELETE BOOK (PROTECTED: Admin Only)
// --------------------------------------------------
exports.deleteBook = async (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM books WHERE id = ?";

    try {
        const [result] = await db.execute(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                status: 'fail', 
                message: `Book with ID ${id} not found.` 
            });
        }

        res.status(204).json({ 
            status: 'success', 
            data: null 
        }); // 204 No Content for successful deletion

    } catch (err) {
        console.error(`Error deleting book ID ${id}:`, err);
        res.status(500).json({ 
            status: 'error', 
            message: 'Server error while deleting book.' 
        });
    }
};
