const express = require('express');
const authRoutes = require('./auth');
const booksRoutes = require('./books');
const usersRoutes = require('./users');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/books', booksRoutes);
router.use('/users', usersRoutes);

module.exports = router;
