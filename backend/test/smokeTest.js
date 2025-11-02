const { randomUUID } = require('crypto');

(async () => {
  try {
    const guid = randomUUID();
    const email = `smoke.${guid}@example.com`;

    console.log('Registering user:', email);
    const reg = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Smoke User', email, password: 'Sm0keTest!' })
    });

    const regJson = await reg.json().catch(() => null);
    console.log('REGISTER:', regJson);

    const token = regJson?.token;
    if (!token) {
      console.error('No token returned from register');
      process.exit(1);
    }

    // Find a book to use in the test
    const booksResp = await fetch('http://localhost:5000/api/books?page=1&limit=1');
    const booksJson = await booksResp.json().catch(() => null);
    const firstBookId = booksJson?.books?.[0]?.id;

    if (!firstBookId) {
      console.error('No books available in the database. Please seed at least one book before running the smoke test.');
      process.exit(1);
    }

    // Create reservation for discovered book id
    console.log(`Creating reservation for bookId=${firstBookId}`);
    const create = await fetch('http://localhost:5000/api/books/reservations', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ bookId: firstBookId })
    });

    const createJson = await create.json().catch(() => null);
    console.log('CREATE:', createJson);

    // List reservations
    const list = await fetch('http://localhost:5000/api/books/reservations', { headers: { Authorization: `Bearer ${token}` } });
    console.log('LIST:', await list.json().catch(() => null));

    // Queue (include auth header)
    const queue = await fetch(`http://localhost:5000/api/books/${firstBookId}/reservation-queue`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('QUEUE:', await queue.json().catch(() => null));

    // Availability (include auth header)
    const avail = await fetch(`http://localhost:5000/api/books/${firstBookId}/reservation-availability`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('AVAIL:', await avail.json().catch(() => null));

    // Cancel reservation if created
    const resId = createJson?.reservation?.id;
    if (resId) {
      const cancel = await fetch(`http://localhost:5000/api/books/reservations/${resId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('CANCEL:', await cancel.json().catch(() => null));
    } else {
      console.log('No reservation id returned; skipping cancel');
    }

    console.log('Smoke test finished');
    process.exit(0);
  } catch (err) {
    console.error('Smoke test error:', err);
    process.exit(1);
  }
})();
