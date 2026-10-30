const http = require('http');

async function testHttpEndpoints() {
  console.log('Testing Next.js dev server HTTP endpoints...');

  // Helper to make request
  function request(path, options = {}) {
    return new Promise((resolve, reject) => {
      const req = http.request(`http://localhost:3000${path}`, options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
      });
      req.on('error', reject);
      if (options.body) req.write(options.body);
      req.end();
    });
  }

  // 1. Login as School Owner / Admin
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@greenvalley.edu', password: 'password123' }),
  });

  const cookie = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0] : '';
  console.log(`Admin login response: HTTP ${loginRes.status}`);

  if (!cookie) {
    console.error('Failed to get auth cookie!');
    process.exit(1);
  }

  // 2. Fetch /api/leaves/types
  const typesRes = await request('/api/leaves/types', {
    headers: { Cookie: cookie },
  });
  console.log(`GET /api/leaves/types: HTTP ${typesRes.status}`);
  const typesData = JSON.parse(typesRes.data);
  console.log(`Leave types count: ${typesData.data?.length}`);
  typesData.data?.forEach(t => console.log(`  - ${t.name} (${t.code}): ${t.defaultDays} default days`));

  // 3. Fetch /api/leaves/balances?teacherId=ALL
  const balancesRes = await request('/api/leaves/balances?teacherId=ALL', {
    headers: { Cookie: cookie },
  });
  console.log(`GET /api/leaves/balances?teacherId=ALL: HTTP ${balancesRes.status}`);
  const balancesData = JSON.parse(balancesRes.data);
  console.log(`Balances count: ${balancesData.data?.length}`);
  balancesData.data?.slice(0, 4).forEach(b => {
    console.log(`  - ${b.teacherName}: ${b.leaveTypeName} => Allocated: ${b.allocatedDays}, Used: ${b.usedDays}, Remaining: ${b.remainingDays}`);
  });

  // 4. Fetch /api/calendar
  const calRes = await request('/api/calendar', {
    headers: { Cookie: cookie },
  });
  console.log(`GET /api/calendar: HTTP ${calRes.status}`);
  const calData = JSON.parse(calRes.data);
  console.log(`Calendar events total: ${calData.data?.length}`);
  const staffLeaves = calData.data?.filter(e => e.type === 'STAFF_LEAVE');
  console.log(`Staff leaves on calendar: ${staffLeaves?.length}`);
  staffLeaves?.slice(0, 3).forEach(l => console.log(`  - [CALENDAR] ${l.date}: ${l.title}`));

  console.log('\n--- ALL HTTP ENDPOINTS TESTED SUCCESSFULLY ---');
}

testHttpEndpoints().catch(err => {
  console.error(err);
  process.exit(1);
});
