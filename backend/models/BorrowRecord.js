const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');
const { User } = require('./User');
const { Book } = require('./Book');

const BorrowRecord = sequelize.define('BorrowRecord', {
  borrow_date: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  return_date: { type: DataTypes.DATEONLY },
  status: { type: DataTypes.ENUM('borrowed','returned'), defaultValue: 'borrowed' }
});

// Associations
User.hasMany(BorrowRecord, { foreignKey: 'user_id' });
Book.hasMany(BorrowRecord, { foreignKey: 'book_id' });
BorrowRecord.belongsTo(User, { foreignKey: 'user_id' });
BorrowRecord.belongsTo(Book, { foreignKey: 'book_id' });

module.exports = { BorrowRecord };
