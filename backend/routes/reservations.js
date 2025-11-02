const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  createReservation,
  getReservations,
  cancelReservation,
  getReservationQueue,
  checkReservationAvailability,
  getReservationHistory
} = require('../controllers/reservationController');

// Create a new reservation
router.post('/books/reservations', auth, createReservation);

// Get all reservations for authenticated user
router.get('/books/reservations', auth, getReservations);

// Cancel a reservation
router.delete('/books/reservations/:reservationId', auth, cancelReservation);

// Get reservation queue for a book
router.get('/books/:bookId/reservation-queue', auth, getReservationQueue);

// Check reservation availability for a book
router.get('/books/:bookId/reservation-availability', auth, checkReservationAvailability);

// Get reservation history
router.get('/users/reservations/history', auth, getReservationHistory);

module.exports = router;