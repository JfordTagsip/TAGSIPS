const axios = require('axios');
const { addDays, subDays } = require('date-fns');

const API_URL = 'http://localhost:5000/api';
let token = '';
let userId = '';
let bookId = '';
let reservationId = '';
let fineId = '';

const test = async () => {
  try {
    // 1. Login to get token
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@test.com',
      password: 'test123'
    });
    token = loginResponse.data.token;
    userId = loginResponse.data.user.id;
    console.log('✅ Login successful');

    // Set auth header for subsequent requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // 2. Create a test book
    console.log('\n2. Creating test book...');
    const bookResponse = await axios.post(`${API_URL}/books`, {
      title: 'Test Book for Reservation',
      author: 'Test Author',
      isbn: '1234567890',
      quantity: 1
    });
    bookId = bookResponse.data._id;
    console.log('✅ Book created:', bookId);

    // 3. Create a reservation
    console.log('\n3. Testing reservation creation...');
    const reservationResponse = await axios.post(`${API_URL}/books/reservations`, {
      bookId,
      startDate: addDays(new Date(), 1),
      duration: 7
    });
    reservationId = reservationResponse.data._id;
    console.log('✅ Reservation created');
    console.log('Queue position:', reservationResponse.data.queuePosition);

    // 4. Get reservation queue
    console.log('\n4. Testing queue position...');
    const queueResponse = await axios.get(`${API_URL}/books/${bookId}/reservation-queue`);
    console.log('✅ Queue position:', queueResponse.data.position);

    // 5. Create an overdue borrow record to test fines
    console.log('\n5. Creating overdue borrow record...');
    const borrowResponse = await axios.post(`${API_URL}/books/${bookId}/borrow`, {
      userId,
      borrowDate: subDays(new Date(), 30) // 30 days ago
    });
    console.log('✅ Borrow record created');

    // 6. Check fines
    console.log('\n6. Checking fines...');
    const finesResponse = await axios.get(`${API_URL}/users/fines`);
    if (finesResponse.data.length > 0) {
      fineId = finesResponse.data[0].id;
      console.log('✅ Fine found:', finesResponse.data[0]);
    }

    // 7. Test fine payment
    if (fineId) {
      console.log('\n7. Testing fine payment...');
      const paymentResponse = await axios.post(`${API_URL}/users/fines/${fineId}/pay`, {
        amount: finesResponse.data[0].amount
      });
      console.log('✅ Payment processed:', paymentResponse.data);
    }

    // 8. Cancel reservation
    console.log('\n8. Testing reservation cancellation...');
    const cancelResponse = await axios.delete(`${API_URL}/books/reservations/${reservationId}`);
    console.log('✅ Reservation cancelled');

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
};

// Run tests
test();