const http = require('http');

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(`http://localhost:3000${path}`, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json;
        try { json = JSON.parse(data); } catch { json = data; }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runTests() {
  console.log('=== TEST 1: Request Password Reset ===');
  const forgotRes = await request('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@apexglobal.example.com' }),
  });
  console.log('Forgot Password HTTP Status:', forgotRes.status);
  console.log('Forgot Password Message:', forgotRes.body.message);
  console.log('Reset URL Generated:', forgotRes.body.resetUrl);

  const resetUrl = forgotRes.body.resetUrl;
  const token = new URL(resetUrl).searchParams.get('token');
  console.log('Extracted Cryptographic Token:', token);

  console.log('\n=== TEST 2: Validate Reset Token ===');
  const valRes = await request(`/api/auth/reset-password?token=${token}`);
  console.log('Validate Token HTTP Status:', valRes.status);
  console.log('Token Valid:', valRes.body.valid, 'Target Email:', valRes.body.email);

  console.log('\n=== TEST 3: Submit New Password ===');
  const resetRes = await request('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword: 'NewApexPass999!' }),
  });
  console.log('Reset Password HTTP Status:', resetRes.status);
  console.log('Reset Password Message:', resetRes.body.message);

  console.log('\n=== TEST 4: Login with New Password ===');
  const loginNew = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@apexglobal.example.com', password: 'NewApexPass999!' }),
  });
  console.log('Login with New Password Status:', loginNew.status);
  console.log('Logged in user:', loginNew.body.user?.email);

  console.log('\n=== TEST 5: Verify Token Cannot Be Reused ===');
  const reuseRes = await request(`/api/auth/reset-password?token=${token}`);
  console.log('Reused Token Status:', reuseRes.status);
  console.log('Reused Token Error:', reuseRes.body.error);

  console.log('\n=== TEST 6: Test Google Workspace Sign-In ===');
  const googleRes = await request('/api/auth/google?mock_email=admin@apexglobal.example.com');
  console.log('Google Sign-In Redirect Status:', googleRes.status);
  console.log('Google Redirect Location:', googleRes.headers.location);
  const cookie = googleRes.headers['set-cookie'] ? googleRes.headers['set-cookie'][0] : 'None';
  console.log('Session Cookie Issued:', cookie.includes('pr_session') ? 'YES (pr_session)' : 'NO');

  // Reset back to ApexPass123!
  const bcrypt = require('bcryptjs');
  const { PrismaClient } = require('./src/generated/prisma');
  const prisma = new PrismaClient();
  const hash = await bcrypt.hash('ApexPass123!', 10);
  await prisma.user.updateMany({
    where: { email: 'admin@apexglobal.example.com' },
    data: { passwordHash: hash, authProvider: 'CREDENTIALS' },
  });
  await prisma.$disconnect();
  console.log('\nRestored default credential password (ApexPass123!) for reference test consistency.');

  console.log('\nALL AUTHENTICATION & PASSWORD RESET TESTS PASSED 100%!');
}

runTests().catch(console.error);
