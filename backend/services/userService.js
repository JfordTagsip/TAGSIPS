const db = require('../db'); 
// Import ang bcrypt - KINAHANGLAN i-install: npm install bcrypt

exports.findByUsername = async (username) => {
    // Kumuha sa user ID, username, ug hashed password
    const query = 'SELECT id, username, password FROM users WHERE username = ?';
    try {
        const [rows] = await db.execute(query, [username]);
        return rows[0]; // Ibalik ang user object
    } catch (error) {
        console.error("Error finding user by username:", error);
        throw error;
    }
};

// ... (ang uban pang functions, sama sa registerUser, etc.)
