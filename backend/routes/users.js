const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { getAllUsers, getProfile, updateProfile } = require('../controllers/usersController');

const router = express.Router();

// Public routes
router.get('/', getAllUsers);

// Protected routes
router.use(protect);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

module.exports = router;
