import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import { PaymentOutlined } from '@mui/icons-material';
import { format } from 'date-fns';
import { userService } from '../services/api';
import { toast } from 'react-toastify';

const FinesManager = () => {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openPayment, setOpenPayment] = useState(false);
  const [selectedFine, setSelectedFine] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const fetchFines = useCallback(async () => {
    try {
      const response = await userService.getUserFines();
      setFines(response.data);
    } catch (error) {
      console.error('Failed to fetch fines:', error?.response?.data || error.message);
      toast.error('Failed to fetch fines');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFines();
  }, [fetchFines]);

  const handleOpenPayment = (fine) => {
    setSelectedFine(fine);
    setPaymentAmount(fine.amount.toString());
    setOpenPayment(true);
  };

  const handleClosePayment = () => {
    setOpenPayment(false);
    setSelectedFine(null);
    setPaymentAmount('');
  };

  const handlePayment = async () => {
    try {
      await userService.payFine(selectedFine.id, {
        amount: parseFloat(paymentAmount),
      });
      toast.success('Payment processed successfully');
      fetchFines();
      handleClosePayment();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    }
  };

  const calculateTotalFines = () => {
    return fines.reduce((total, fine) => total + (fine.paid ? 0 : fine.amount), 0);
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Your Fines</Typography>
        <Typography variant="h6" color="error">
          Total Outstanding: ${calculateTotalFines().toFixed(2)}
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Book</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Return Date</TableCell>
              <TableCell>Days Overdue</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No fines found
                </TableCell>
              </TableRow>
            ) : (
              fines.map((fine) => (
                <TableRow key={fine.id}>
                  <TableCell>{fine.book.title}</TableCell>
                  <TableCell>
                    {format(new Date(fine.dueDate), 'PP')}
                  </TableCell>
                  <TableCell>
                    {fine.returnDate
                      ? format(new Date(fine.returnDate), 'PP')
                      : 'Not returned'}
                  </TableCell>
                  <TableCell>{fine.daysOverdue}</TableCell>
                  <TableCell align="right">${fine.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    {fine.paid ? (
                      <Typography color="success.main">Paid</Typography>
                    ) : (
                      <Typography color="error">Unpaid</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {!fine.paid && (
                      <Button
                        startIcon={<PaymentOutlined />}
                        onClick={() => handleOpenPayment(fine)}
                      >
                        Pay
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openPayment} onClose={handleClosePayment}>
        <DialogTitle>Pay Fine</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Book: {selectedFine?.book.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Fine Amount: ${selectedFine?.amount.toFixed(2)}
            </Typography>
            <TextField
              label="Payment Amount"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              fullWidth
              margin="normal"
              InputProps={{
                inputProps: { min: 0, max: selectedFine?.amount },
              }}
            />
            <Alert severity="info" sx={{ mt: 2 }}>
              Payment will be processed using the library's payment system.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePayment}>Cancel</Button>
          <Button
            onClick={handlePayment}
            variant="contained"
            disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
          >
            Process Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FinesManager;