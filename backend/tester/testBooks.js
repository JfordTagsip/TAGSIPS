import axios from "axios";

const API_URL = "http://localhost:5000/api/books";

const test = async () => {
  try {
    // Test GET all books
    const response = await axios.get(API_URL);
    console.log("Books:", response.data);

    // Test POST a new book
    const newBook = { title: "Test Book", author: "Author X", isbn: "123456" };
    const postResponse = await axios.post(API_URL, newBook);
    console.log("Created Book:", postResponse.data);
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
};

test();
