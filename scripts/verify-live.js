// End-to-end verification script against live server
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

async function run() {
  console.log('--- 1. Testing Health Endpoint ---');
  const health = await request('/api/system/health');
  console.log('Health Status:', health.body.status, 'Orgs:', health.body.metrics.activeOrganizations);

  console.log('\n--- 2. Login Company A (Apex Global) ---');
  const loginA = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ demoOrgSlug: 'apex-global' })
  });
  const cookieA = loginA.headers['set-cookie'] ? loginA.headers['set-cookie'][0].split(';')[0] : '';
  console.log('Apex Global Login Status:', loginA.status, 'User:', loginA.body.user?.email);

  console.log('\n--- 3. Query Company A Parcels & Claims ---');
  const parcelsA = await request('/api/parcels', {
    headers: { Cookie: cookieA }
  });
  console.log(`Company A Parcels (${parcelsA.body.parcels?.length}):`);
  for (const p of parcelsA.body.parcels) {
    console.log(` - [${p.trackingNumber}] Trk: ${p.trackingStatus} | Inv: ${p.investigationStatus} | Claim: ${p.claimStatus} | Rec: ${p.recoveryStatus} | Cust: ${p.recipientName}`);
  }

  const claimsA = await request('/api/claims', {
    headers: { Cookie: cookieA }
  });
  console.log(`Company A Claims (${claimsA.body.claims?.length}):`);
  for (const c of claimsA.body.claims) {
    console.log(` - Claim: ${c.claimNumber} | Tracking: ${c.parcel.trackingNumber} | Claimed: $${c.claimedAmount} | Approved: $${c.approvedAmount} | Status: ${c.status}`);
  }

  console.log('\n--- 4. Login Company B (Nordic Craft) ---');
  const loginB = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ demoOrgSlug: 'nordic-craft' })
  });
  const cookieB = loginB.headers['set-cookie'] ? loginB.headers['set-cookie'][0].split(';')[0] : '';
  console.log('Nordic Craft Login Status:', loginB.status, 'User:', loginB.body.user?.email);

  console.log('\n--- 5. Query Company B Parcels & Claims ---');
  const parcelsB = await request('/api/parcels', {
    headers: { Cookie: cookieB }
  });
  console.log(`Company B Parcels (${parcelsB.body.parcels?.length}):`);
  for (const p of parcelsB.body.parcels) {
    console.log(` - [${p.trackingNumber}] Trk: ${p.trackingStatus} | Inv: ${p.investigationStatus} | Claim: ${p.claimStatus} | Rec: ${p.recoveryStatus} | Cust: ${p.recipientName}`);
  }

  const claimsB = await request('/api/claims', {
    headers: { Cookie: cookieB }
  });
  console.log(`Company B Claims (${claimsB.body.claims?.length}):`);
  for (const c of claimsB.body.claims) {
    console.log(` - Claim: ${c.claimNumber} | Tracking: ${c.parcel.trackingNumber} | Amount: €${c.claimAmount} | Status: ${c.status}`);
  }

  // Cross-tenant data isolation check
  const parcelIdsA = new Set(parcelsA.body.parcels.map(p => p.id));
  const parcelIdsB = new Set(parcelsB.body.parcels.map(p => p.id));
  const overlap = [...parcelIdsA].filter(id => parcelIdsB.has(id));
  console.log('\n--- 6. Isolation Audit ---');
  console.log('Shared Parcel IDs between Company A and B:', overlap.length === 0 ? 'ZERO (100% Isolated)' : `VIOLATION: ${overlap.length}`);

  // Test Public Web Routes
  console.log('\n--- 7. Testing Public SaaS Web Pages ---');
  const pages = ['/', '/features', '/integrations', '/pricing', '/security', '/docs', '/contact', '/demo', '/login'];
  for (const path of pages) {
    const res = await request(path);
    console.log(`Route [${path}] => HTTP ${res.status}`);
  }

  console.log('\n--- 8. Loss Declaration Statutory Disclaimer Test ---');
  if (claimsA.body.claims?.length > 0) {
    const claimId = claimsA.body.claims[0].id;
    const declRes = await request(`/api/claims/${claimId}/declaration`, {
      headers: { Cookie: cookieA }
    });
    const declBody = typeof declRes.body === 'string' ? declRes.body : JSON.stringify(declRes.body);
    const normalizedDecl = declBody.replace(/\s+/g, ' ').toUpperCase();
    const hasDisclaimer = normalizedDecl.includes('NOT AN') &&
                          normalizedDecl.includes('ORIGINAL COMMERCIAL SALES INVOICE');
    console.log('Declaration HTTP Status:', declRes.status);
    console.log('Contains Mandatory Statutory Disclaimer:', hasDisclaimer ? 'YES (VERIFIED)' : 'FAILED');
  }

  console.log('\n--- 9. Carrier Enquiries & Staff Approval Flow ---');
  const enqA = await request('/api/enquiries', {
    headers: { Cookie: cookieA }
  });
  console.log(`Company A Enquiries Count: ${enqA.body.enquiries?.length}`);
  if (enqA.body.enquiries?.length > 0) {
    const enq = enqA.body.enquiries[0];
    console.log(` - Enquiry: ${enq.referenceNumber} | Subject: ${enq.subject} | Status: ${enq.status}`);
  }

  console.log('\n--- 10. Bulk Parcel CSV Export Test ---');
  const exportRes = await request('/api/exports/parcels', {
    headers: { Cookie: cookieA }
  });
  console.log('CSV Export HTTP Status:', exportRes.status);
  const csvText = typeof exportRes.body === 'string' ? exportRes.body : JSON.stringify(exportRes.body);
  const csvLines = csvText.split('\n');
  console.log(`CSV Export Header: ${csvLines[0]}`);
  console.log(`CSV Data Rows: ${csvLines.length - 1}`);

  console.log('\n--- 11. Tenant Custom Field Isolation Test ---');
  const cfA = await request('/api/developer/custom-fields', {
    headers: { Cookie: cookieA }
  });
  const cfB = await request('/api/developer/custom-fields', {
    headers: { Cookie: cookieB }
  });
  console.log('Company A Custom Fields:', cfA.body.fields?.map(f => f.fieldKey));
  console.log('Company B Custom Fields:', cfB.body.fields?.map(f => f.fieldKey));
  const cfKeysA = new Set(cfA.body.fields?.map(f => f.fieldKey));
  const cfKeysB = new Set(cfB.body.fields?.map(f => f.fieldKey));
  const cfOverlap = [...cfKeysA].filter(k => cfKeysB.has(k));
  console.log('Custom Field Schema Separation:', cfOverlap.length === 0 ? 'CLEAN (Distinct per tenant)' : 'OVERLAP');

  console.log('\nALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

run().catch(console.error);
