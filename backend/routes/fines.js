const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { calculateFine, getUserFines, payFine, getFineHistory } = require('../controllers/fineController');

// Get user's fines
router.get('/users/fines', auth, getUserFines);

// Calculate fine for a specific borrow record
router.get('/users/fines/calculate/:borrowId', auth, calculateFine);

// Pay a fine
router.post('/users/fines/:fineId/pay', auth, payFine);

// Get fine payment history
router.get('/users/fines/history', auth, getFineHistory);

module.exports = router;