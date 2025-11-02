const jwt = require('jsonwebtoken');
const { getDB } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-here';

// Middleware to protect routes that require authentication
const protect = async (req, res, next) => {
    let token;

    // Get token from the Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized to access this route' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Get user from database
        const db = await getDB();
        const user = await db.get('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id]);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

                console.log('Auth middleware:', { decoded, user });
        
        // Add user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({ message: 'Not authorized to access this route' });
    }
};

// Middleware to restrict access based on user role
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized to perform this action' });
        }
        next();
    };
};

module.exports = {
    protect,
    restrictTo
};