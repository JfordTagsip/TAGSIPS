export const validateBook = (req, res, next) => {
  const { title, author, isbn } = req.body;
  if (!title || !author || !isbn) {
    return res.status(400).json({ message: "All fields are required" });
  }
  next();
};
