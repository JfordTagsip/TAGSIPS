import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  books: [],
  selectedBook: null,
  isLoading: false,
  error: null,
};

const bookSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    fetchBooksStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchBooksSuccess: (state, action) => {
      state.isLoading = false;
      state.books = action.payload;
    },
    fetchBooksFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    setSelectedBook: (state, action) => {
      state.selectedBook = action.payload;
    },
    addBook: (state, action) => {
      state.books.push(action.payload);
    },
    updateBook: (state, action) => {
      const index = state.books.findIndex(book => book.id === action.payload.id);
      if (index !== -1) {
        state.books[index] = action.payload;
      }
    },
    deleteBook: (state, action) => {
      state.books = state.books.filter(book => book.id !== action.payload);
    },
  },
});

export const {
  fetchBooksStart,
  fetchBooksSuccess,
  fetchBooksFailure,
  setSelectedBook,
  addBook,
  updateBook,
  deleteBook,
} = bookSlice.actions;

export default bookSlice.reducer;