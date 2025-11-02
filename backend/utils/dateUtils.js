const { addDays, differenceInDays } = require('date-fns');

// Calculate number of days overdue
exports.calculateOverdueDays = (dueDate) => {
  const today = new Date();
  const due = new Date(dueDate);
  const days = differenceInDays(today, due);
  return Math.max(0, days); // Return 0 if not overdue
};

// Calculate due date based on borrow date and duration
exports.calculateDueDate = (borrowDate, duration) => {
  return addDays(new Date(borrowDate), duration);
};

// Check if a date range overlaps with another
exports.datesOverlap = (start1, end1, start2, end2) => {
  return start1 <= end2 && end1 >= start2;
};