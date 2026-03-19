const axios = require('axios');
const FormData = require('form-data');

async function testUpload() {
  try {
    const form = new FormData();
    form.append('claimantName', 'Rahul');
    form.append('policyId', 'POL-123');
    form.append('amount', '500');
    form.append('claimType', 'Auto Insurance');
    // dummy file
    form.append('files', Buffer.from('fake image'), { filename: 'test.jpg' });

    console.log('Sending request to /api/claims...');
    // Add auth token if needed, or bypass.
    // Is auth required in local env?
    // Let's create a temp user and login
    let token = '';
    try {
      const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'admin@claimshield.com',
        password: 'password123'
      });
      token = loginRes.data.token || '';
      console.log('Got token', token.substring(0, 10));
    } catch(err) {
      console.log('Login failed, we might not have a mocked test user or db is down.', err.message);
    }
    
    // We can also post to an unauthenticated dummy route we create
  } catch(e) {
    console.error(e.message);
  }
}
testUpload();
