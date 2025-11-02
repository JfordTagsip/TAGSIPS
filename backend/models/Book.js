const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Book = sequelize.define('Book', {
  title: { type: DataTypes.STRING, allowNull: false },
  author: { type: DataTypes.STRING, allowNull: false },
  isbn: { type: DataTypes.STRING, unique: true },
  published_year: { type: DataTypes.INTEGER },
  copies: { type: DataTypes.INTEGER, defaultValue: 1 }
});

module.exports = { Book };
