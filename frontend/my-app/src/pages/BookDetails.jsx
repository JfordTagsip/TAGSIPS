import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { bookService } from '../services/api';

const BookDetails = () => {
  const [book, setBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchBookDetails();
  }, [id]);

  const fetchBookDetails = async () => {
    try {
      const response = await bookService.getBook(id);
      setBook(response.data);
    } catch (error) {
      toast.error('Failed to fetch book details');
      navigate('/books');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBorrow = async () => {
    try {
      await bookService.borrowBook(id, user.id);
      toast.success('Book borrowed successfully');
      fetchBookDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to borrow book');
    }
  };

  const handleReturn = async () => {
    try {
      await bookService.returnBook(id, user.id);
      toast.success('Book returned successfully');
      fetchBookDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to return book');
    }
  };

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  if (!book) {
    return <Typography>Book not found</Typography>;
  }

  const isBookBorrowed = book.borrowRecords?.some(
    record => record.userId === user.id && !record.returnDate
  );

  return (
    <Container>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/books')}
        sx={{ mb: 4 }}
      >
        Back to Books
      </Button>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              {book.title}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              by {book.author}
            </Typography>
            
            <Box sx={{ my: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    ISBN
                  </Typography>
                  <Typography>{book.isbn}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Available Copies
                  </Typography>
                  <Typography>{book.quantity}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={book.quantity > 0 ? 'Available' : 'Out of Stock'}
                    color={book.quantity > 0 ? 'success' : 'error'}
                    size="small"
                  />
                </Grid>
              </Grid>
            </Box>

            {book.description && (
              <Box sx={{ my: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1">
                  {book.description}
                </Typography>
              </Box>
            )}

            {user.role !== 'admin' && (
              <Box sx={{ mt: 3 }}>
                {isBookBorrowed ? (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleReturn}
                  >
                    Return Book
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleBorrow}
                    disabled={book.quantity === 0}
                  >
                    Borrow Book
                  </Button>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Borrow History
            </Typography>
            {book.borrowRecords && book.borrowRecords.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Borrow Date</TableCell>
                      <TableCell>Return Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {book.borrowRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.userName}</TableCell>
                        <TableCell>
                          {new Date(record.borrowDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {record.returnDate
                            ? new Date(record.returnDate).toLocaleDateString()
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No borrow history available
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default BookDetails;