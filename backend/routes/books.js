const express = require('express');
const { 
        getAllBooks, 
        createBook, 
        getBookById, 
        updateBook, 
        deleteBook,
        borrowBook,
        returnBook,
        getRecommendations
} = require('../controllers/booksController');
const { 
    createReservation,
    getReservations,
    cancelReservation,
    getReservationQueue,
    checkReservationAvailability
} = require('../controllers/reservationController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', getAllBooks);

// Protected routes - all require authentication
router.use(protect);

// Protected reservation routes (must come before /:id routes)
router.get('/reservations', getReservations);
router.post('/reservations', createReservation);
router.delete('/reservations/:id', cancelReservation);

// Book-specific routes
router.get('/recommendations', getRecommendations);
router.get('/:id', getBookById);
router.get('/:id/reservation-queue', getReservationQueue);
router.get('/:id/reservation-availability', checkReservationAvailability);
router.post('/:id/borrow', borrowBook);
router.post('/:id/return', returnBook);

// Admin only routes
router.use(restrictTo('admin'));
router.post('/', createBook);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);

module.exports = router;
