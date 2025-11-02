import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// Book services
export const bookService = {
  getAllBooks: (page = 1, limit = 10, search = '', filter = '') => 
    api.get('/books', { params: { page, limit, search, filter } }),
  getBook: (id) => api.get(`/books/${id}`),
  addBook: (bookData) => api.post('/books', bookData),
  updateBook: (id, bookData) => api.put(`/books/${id}`, bookData),
  deleteBook: (id) => api.delete(`/books/${id}`),
  borrowBook: (bookId, userId) => api.post(`/books/${bookId}/borrow`, { userId }),
  returnBook: (bookId, userId) => api.post(`/books/${bookId}/return`, { userId }),
  searchBooks: (query) => api.get(`/books/search`, { params: { query } }),
  getDashboardStats: () => api.get('/dashboard/stats'),
  exportData: (type) => api.get(`/export/${type}`, { responseType: 'blob' }),
  getOverdueBooks: () => api.get('/books/overdue'),
  getPopularBooks: () => api.get('/books/popular'),
  getCategoryStats: () => api.get('/books/categories'),
  getRecommendations: () => api.get('/books/recommendations'),
  getNotifications: () => api.get('/notifications'),
  markNotificationAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllNotificationsAsRead: () => api.put('/notifications/read-all'),
  sendEmailNotifications: () => api.post('/notifications/send-email'),
  updateNotificationPreferences: (preferences) => api.put('/notifications/preferences', preferences),
  getSimilarBooks: (bookId) => api.get(`/books/${bookId}/similar`),
  // New reservation endpoints
  createReservation: (reservationData) => api.post('/books/reservations', reservationData),
  getReservations: () => api.get('/books/reservations'),
  cancelReservation: (reservationId) => api.delete(`/books/reservations/${reservationId}`),
  getReservationQueue: (bookId) => api.get(`/books/${bookId}/reservation-queue`),
  checkReservationAvailability: (bookId) => api.get(`/books/${bookId}/reservation-availability`),
};

// User services
export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  getAllUsers: (page = 1, limit = 10, search = '', filter = '') =>
    api.get('/users', { params: { page, limit, search, filter } }),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUserStatus: (id, status) => api.patch(`/users/${id}/status`, status),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getBorrowHistory: () => api.get('/users/profile/borrow-history'),
  searchUsers: (query) => api.get(`/users/search`, { params: { query } }),
  // New fine management endpoints
  getUserFines: () => api.get('/users/fines'),
  payFine: (fineId, paymentData) => api.post(`/users/fines/${fineId}/pay`, paymentData),
  getFineHistory: () => api.get('/users/fines/history'),
  calculateFine: (borrowId) => api.get(`/users/fines/calculate/${borrowId}`),
  // Reservation management
  getUserReservations: () => api.get('/users/reservations'),
  getReservationHistory: () => api.get('/users/reservations/history'),
};

export default api;