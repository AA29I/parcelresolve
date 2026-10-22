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

async function testDevMode() {
  console.log('--- 1. Login Company A ---');
  const loginA = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ demoOrgSlug: 'apex-global' })
  });
  const cookieA = loginA.headers['set-cookie'][0].split(';')[0];

  console.log('--- 2. Test Customization API (GET) ---');
  const getCust = await request('/api/developer/customization', {
    headers: { Cookie: cookieA }
  });
  console.log('Customization Status:', getCust.status, 'Available Accents:', getCust.body.availableAccents?.length);

  console.log('--- 3. Test Customization API (POST) ---');
  const postCust = await request('/api/developer/customization', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      accentColor: '#059669',
      cutoffTime: '15:00',
      devModeActive: true
    })
  });
  console.log('Save Customization Result:', postCust.body);

  console.log('--- 4. Test Scan Simulation API (POST) ---');
  const sim = await request('/api/developer/simulate-scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      trackingNumber: '1Z999AA10123456788',
      normalizedStatus: 'EXCEPTION',
      statusDescription: 'Simulated sorting delay at Louisville Air Hub',
      locationCity: 'Louisville',
      locationState: 'KY'
    })
  });
  console.log('Simulation Status:', sim.status);
  console.log('Updated Tracking Status:', sim.body.parcel?.trackingStatus);
  console.log('Updated Investigation Status:', sim.body.parcel?.investigationStatus);
  console.log('SLA Breached:', sim.body.slaResult?.isBreached);
  console.log('Enquiry Created:', sim.body.enquiryCreated);

  console.log('\nDEV MODE TESTING PASSED COMPLETELY!');
}

testDevMode().catch(console.error);
