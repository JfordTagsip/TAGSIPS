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
router.get('/recommendations', protect, getRecommendations);
router.get('/:id', getBookById);

// Reservation-related public checks
router.get('/:id/reservation-queue', getReservationQueue);
router.get('/:id/reservation-availability', checkReservationAvailability);

// Protected routes
router.use(protect);

// Borrowing routes
router.post('/:id/borrow', borrowBook);
router.post('/:id/return', returnBook);

// Reservations collection routes
router.post('/reservations', createReservation);
router.get('/reservations', getReservations);
router.delete('/reservations/:id', cancelReservation);

// Admin only routes
router.use(restrictTo('admin'));
router.post('/', createBook);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);

module.exports = router;
