import db from "../db.js";

export const getAllBooksService = async () => {
  const [rows] = await db.query("SELECT * FROM books");
  return rows;
};

export const createBookService = async (data) => {
  const { title, author, isbn } = data;
  const [result] = await db.query(
    "INSERT INTO books (title, author, isbn) VALUES (?, ?, ?)",
    [title, author, isbn]
  );
  return { id: result.insertId, ...data };
};
