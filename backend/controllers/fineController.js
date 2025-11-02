const Fine = require('../models/Fine');
const { calculateOverdueDays } = require('../utils/dateUtils');

// Calculate fine amount based on days overdue
const calculateFineAmount = (daysOverdue) => {
  // $0.50 per day overdue
  return daysOverdue * 0.5;
};

// Get user's fines
exports.getUserFines = async (req, res) => {
  try {
    const fines = await Fine.findByUser(req.user.id);
    const formattedFines = fines.map(fine => ({
      id: fine.id,
      bookTitle: fine.book_title,
      dueDate: fine.due_date,
      daysOverdue: fine.days_overdue,
      amount: parseFloat(fine.amount),
      createdAt: fine.created_at
    }));

    res.json(formattedFines);
  } catch (error) {
    console.error('Error fetching fines:', error);
    res.status(500).json({ message: 'Error fetching fines' });
  }
};

// Calculate fine for a specific borrow record
exports.calculateFine = async (req, res) => {
  try {
    const [borrowRecords] = await db.execute(
      'SELECT * FROM borrow_records WHERE id = ? AND user_id = ?',
      [req.params.borrowId, req.user.id]
    );

    if (borrowRecords.length === 0) {
      return res.status(404).json({ message: 'Borrow record not found' });
    }

    const borrowRecord = borrowRecords[0];
    const daysOverdue = calculateOverdueDays(borrowRecord.due_date);
    const amount = calculateFineAmount(daysOverdue);

    res.json({ daysOverdue, amount });
  } catch (error) {
    console.error('Error calculating fine:', error);
    res.status(500).json({ message: 'Error calculating fine' });
  }
};

// Pay a fine
exports.payFine = async (req, res) => {
  try {
    const fine = await Fine.findById(req.params.fineId);

    if (!fine) {
      return res.status(404).json({ message: 'Fine not found' });
    }

    if (fine.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (fine.paid) {
      return res.status(400).json({ message: 'Fine already paid' });
    }

    const { amount } = req.body;
    if (amount < fine.amount) {
      return res.status(400).json({ message: 'Insufficient payment amount' });
    }

    const success = await Fine.updatePayment(fine.id, amount);
    
    if (success) {
      res.json({ message: 'Fine paid successfully' });
    } else {
      res.status(500).json({ message: 'Error processing payment' });
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Error processing payment' });
  }
};

// Get fine payment history
exports.getFineHistory = async (req, res) => {
  try {
    const history = await Fine.getFineHistory(req.user.id);
    
    const formattedHistory = history.map(fine => ({
      id: fine.id,
      bookTitle: fine.book_title,
      daysOverdue: fine.days_overdue,
      amount: parseFloat(fine.amount),
      paidAmount: parseFloat(fine.paid_amount),
      paidAt: fine.paid_at
    }));

    res.json(formattedHistory);
  } catch (error) {
    console.error('Error fetching fine history:', error);
    res.status(500).json({ message: 'Error fetching fine history' });
  }
};

// Update fine status automatically
exports.updateFineStatus = async (borrowRecord) => {
  try {
    const daysOverdue = calculateOverdueDays(borrowRecord.dueDate);
    if (daysOverdue > 0) {
      const amount = calculateFineAmount(daysOverdue);
      const fine = new Fine({
        user: borrowRecord.user,
        borrowRecord: borrowRecord._id,
        daysOverdue,
        amount,
        paid: false
      });
      await fine.save();
    }
  } catch (error) {
    console.error('Error updating fine status:', error);
  }
};