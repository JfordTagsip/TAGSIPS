export const validateEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;
  return re.test(password);
};

export const validateISBN = (isbn) => {
  // Remove any hyphens or spaces from the ISBN
  const cleanISBN = isbn.replace(/[-\s]/g, '');
  
  // Check if it's a valid ISBN-10 or ISBN-13
  if (cleanISBN.length === 10) {
    return validateISBN10(cleanISBN);
  } else if (cleanISBN.length === 13) {
    return validateISBN13(cleanISBN);
  }
  return false;
};

const validateISBN10 = (isbn) => {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const digit = parseInt(isbn[i]);
    if (isNaN(digit)) return false;
    sum += digit * (10 - i);
  }
  
  const lastChar = isbn[9].toUpperCase();
  const lastDigit = lastChar === 'X' ? 10 : parseInt(lastChar);
  if (isNaN(lastDigit) && lastChar !== 'X') return false;
  
  sum += lastDigit;
  return sum % 11 === 0;
};

const validateISBN13 = (isbn) => {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(isbn[i]);
    if (isNaN(digit)) return false;
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }
  
  const checkDigit = parseInt(isbn[12]);
  if (isNaN(checkDigit)) return false;
  
  return (10 - (sum % 10)) % 10 === checkDigit;
};

export const getPasswordStrength = (password) => {
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (password.match(/[a-z]+/)) strength++;
  if (password.match(/[A-Z]+/)) strength++;
  if (password.match(/[0-9]+/)) strength++;
  if (password.match(/[!@#$%^&*(),.?":{}|<>]+/)) strength++;
  
  switch (strength) {
    case 0:
    case 1:
      return { score: 1, label: 'Very Weak', color: 'error' };
    case 2:
      return { score: 2, label: 'Weak', color: 'warning' };
    case 3:
      return { score: 3, label: 'Medium', color: 'info' };
    case 4:
      return { score: 4, label: 'Strong', color: 'success' };
    case 5:
      return { score: 5, label: 'Very Strong', color: 'success' };
    default:
      return { score: 0, label: 'None', color: 'error' };
  }
};

export const validateBookData = (bookData) => {
  const errors = {};
  
  if (!bookData.title?.trim()) {
    errors.title = 'Title is required';
  }
  
  if (!bookData.author?.trim()) {
    errors.author = 'Author is required';
  }
  
  if (!bookData.isbn?.trim()) {
    errors.isbn = 'ISBN is required';
  } else if (!validateISBN(bookData.isbn)) {
    errors.isbn = 'Invalid ISBN format';
  }
  
  if (!bookData.quantity || bookData.quantity < 0) {
    errors.quantity = 'Quantity must be a positive number';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateUserData = (userData) => {
  const errors = {};
  
  if (!userData.name?.trim()) {
    errors.name = 'Name is required';
  }
  
  if (!userData.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(userData.email)) {
    errors.email = 'Invalid email format';
  }
  
  if (userData.password !== undefined) {
    if (!userData.password) {
      errors.password = 'Password is required';
    } else if (!validatePassword(userData.password)) {
      errors.password = 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number';
    }
    
    if (userData.confirmPassword !== undefined && userData.password !== userData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};