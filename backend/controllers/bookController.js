// Assuming this is your bookController.js file

import Book from '../models/Book.js';
// ... other imports if applicable (like mongoose, etc.)

/**
 * @desc Get all books with search, filtering, and pagination
 * @route GET /api/books
 * @access Public
 */
export const getBooks = async (req, res) => {
    try {
        // 1. Get query parameters for pagination and search
        const { page = 1, limit = 10, search = '' } = req.query;

        // Calculate skip value
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;

        // 2. Build the search/filter query
        const query = {};
        if (search) {
            // Case-insensitive search on title and author fields
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { title: { $regex: searchRegex } },
                { author: { $regex: searchRegex } }
            ];
        }

        // 3. Get total count (for pagination metadata)
        const totalBooks = await Book.countDocuments(query);

        // 4. Execute the paginated and filtered query
        const books = await Book.find(query)
            .sort({ title: 1 }) // Sort alphabetically by title
            .skip(skip)
            .limit(limitNumber);

        // 5. Send paginated data and metadata
        res.status(200).json({
            success: true,
            data: books,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalBooks / limitNumber),
            totalItems: totalBooks
        });

    } catch (error) {
        console.error('Error fetching books with pagination:', error);
        res.status(500).json({ success: false, message: 'Server error fetching books.' });
    }
};

// ... other controller functions (getBookById, addBook, etc.)

// NOTE: Make sure to include all other controller functions (like getBookById, addBook, etc.)
// below this if they were previously in this file.
