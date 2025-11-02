import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addDays, format } from 'date-fns';
import { bookService } from '../services/api';
import { toast } from 'react-toastify';

const ReservationDialog = ({ open, onClose, book, onReserve }) => {
  const [pickupDate, setPickupDate] = useState(addDays(new Date(), 1));
  const [duration, setDuration] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleReserve = async () => {
    setLoading(true);
    setError(null);

    try {
      const reservationData = {
        bookId: book.id,
        pickupDate: format(pickupDate, 'yyyy-MM-dd'),
        duration,
      };

      await bookService.createReservation(reservationData);
      toast.success('Book reserved successfully');
      onReserve();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reserve book');
      toast.error(err.response?.data?.message || 'Failed to reserve book');
    } finally {
      setLoading(false);
    }
  };

  const minDate = addDays(new Date(), 1);
  const maxDate = addDays(new Date(), 30);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Reserve Book</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">{book?.title}</Typography>
          <Typography variant="subtitle2" color="text.secondary">
            by {book?.author}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Pickup Date"
            value={pickupDate}
            onChange={(newValue) => setPickupDate(newValue)}
            minDate={minDate}
            maxDate={maxDate}
            renderInput={(params) => (
              <TextField {...params} fullWidth sx={{ mb: 2 }} />
            )}
          />
        </LocalizationProvider>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Duration (days)</InputLabel>
          <Select
            value={duration}
            label="Duration (days)"
            onChange={(e) => setDuration(e.target.value)}
          >
            <MenuItem value={7}>7 days</MenuItem>
            <MenuItem value={14}>14 days</MenuItem>
            <MenuItem value={21}>21 days</MenuItem>
          </Select>
        </FormControl>

        <Typography variant="body2" color="text.secondary">
          Expected Return Date: {format(addDays(pickupDate, duration), 'PPP')}
        </Typography>

        {book?.reservations?.length > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            This book has {book.reservations.length} active reservation(s).
            Your position in queue will be {book.reservations.length + 1}.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleReserve}
          variant="contained"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Reserving...' : 'Reserve Book'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReservationDialog;