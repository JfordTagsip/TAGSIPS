import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import BookRecommendations from '../components/BookRecommendations';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Box,
  Paper,
  InputBase,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { bookService } from '../services/api';
import {
  fetchBooksStart,
  fetchBooksSuccess,
  fetchBooksFailure,
  addBook,
  updateBook,
  deleteBook,
} from '../store/slices/bookSlice';

const Books = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    quantity: '',
    description: '',
  });

  const { books, isLoading } = useSelector((state) => state.books);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const fetchBooks = useCallback(async () => {
    dispatch(fetchBooksStart());
    try {
      const response = await bookService.getAllBooks();
      dispatch(fetchBooksSuccess(response.data));
    } catch (error) {
      dispatch(fetchBooksFailure(error.message));
      toast.error('Failed to fetch books');
    }
  }, [dispatch]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleOpenDialog = (book = null) => {
    if (book) {
      setSelectedBook(book);
      setFormData({
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        quantity: book.quantity,
        description: book.description || '',
      });
    } else {
      setSelectedBook(null);
      setFormData({
        title: '',
        author: '',
        isbn: '',
        quantity: '',
        description: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBook(null);
    setFormData({
      title: '',
      author: '',
      isbn: '',
      quantity: '',
      description: '',
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedBook) {
        const response = await bookService.updateBook(selectedBook.id, formData);
        dispatch(updateBook(response.data));
        toast.success('Book updated successfully');
      } else {
        const response = await bookService.addBook(formData);
        dispatch(addBook(response.data));
        toast.success('Book added successfully');
      }
      handleCloseDialog();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await bookService.deleteBook(id);
        dispatch(deleteBook(id));
        toast.success('Book deleted successfully');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete book');
      }
    }
  };

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.isbn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Books
        </Typography>
        {user?.role === 'admin' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Book
          </Button>
        )}
      </Box>

      <Paper
        component="form"
        sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', mb: 4 }}
      >
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="Search books..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <IconButton type="button" sx={{ p: '10px' }} aria-label="search">
          <SearchIcon />
        </IconButton>
      </Paper>

      <Box sx={{ mb: 4 }}>
        <BookRecommendations />
      </Box>

      <Grid container spacing={3}>
        {isLoading ? (
          <Typography>Loading...</Typography>
        ) : filteredBooks.length === 0 ? (
          <Typography>No books found.</Typography>
        ) : (
          filteredBooks.map((book) => (
            <Grid item xs={12} sm={6} md={4} key={book.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {book.title}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    by {book.author}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ISBN: {book.isbn}
                  </Typography>
                  <Typography variant="body2">
                    Available: {book.quantity}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => navigate(`/books/${book.id}`)}>
                    View Details
                  </Button>
                  {user?.role === 'admin' && (
                    <>
                      <IconButton onClick={() => handleOpenDialog(book)} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(book.id)} size="small">
                        <DeleteIcon />
                      </IconButton>
                    </>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedBook ? 'Edit Book' : 'Add New Book'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Author"
              name="author"
              value={formData.author}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="ISBN"
              name="isbn"
              value={formData.isbn}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Quantity"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Description"
              name="description"
              multiline
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {selectedBook ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Books;