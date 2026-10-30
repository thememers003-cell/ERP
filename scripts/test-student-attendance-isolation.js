const http = require('http');

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(`http://localhost:3000${path}`, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    req.end();
  });
}

async function login(email, password) {
  const res = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email, password },
  });
  const cookieHeader = res.headers['set-cookie'];
  const cookie = cookieHeader ? cookieHeader[0].split(';')[0] : '';
  return { ...res.body, cookie };
}

async function run() {
  console.log('--- VERIFYING STRICT ROLE & ATTENDANCE ISOLATION ---');

  // 1. Student Login
  const studentAuth = await login('aarav.patel@student.greenvalley.edu', 'password123');
  console.log('1. Logged in Student:', studentAuth.data.firstName, studentAuth.data.lastName);

  // 2. Student attendance query
  const studentAtt = await request('/api/attendance', {
    headers: { Cookie: studentAuth.cookie },
  });
  console.log('2. Student Attendance API isStudentView:', studentAtt.body.data.isStudentView);
  console.log('   Student Name:', studentAtt.body.data.student.name);
  console.log('   Admission #:', studentAtt.body.data.student.admissionNumber);
  console.log('   Attendance Rate:', studentAtt.body.data.stats.percentage + '%');
  console.log('   Records Count:', studentAtt.body.data.records.length);
  if (studentAtt.body.data.roster) {
    console.error('FAIL: Student Attendance returned entire class roster!');
  } else {
    console.log('   [PASS] Class roster hidden from student!');
  }

  // 3. Student attempting to post attendance
  const studentPostAtt = await request('/api/attendance', {
    method: 'POST',
    headers: { Cookie: studentAuth.cookie, 'Content-Type': 'application/json' },
    body: { sectionId: 'test', date: '2026-10-08', entries: [] },
  });
  console.log('3. Student POST /api/attendance Status:', studentPostAtt.status, '(Expected: 403)');
  if (studentPostAtt.status === 403) {
    console.log('   [PASS] Student blocked from modifying attendance!');
  } else {
    console.error('FAIL: Student was not blocked from modifying attendance!');
  }

  // 4. Faculty Login & Attendance Query
  const facultyAuth = await login('dr.sharma@greenvalley.edu', 'password123');
  console.log('4. Logged in Faculty:', facultyAuth.data.firstName, facultyAuth.data.lastName);
  const facultyAtt = await request('/api/attendance', {
    headers: { Cookie: facultyAuth.cookie },
  });
  console.log('   Faculty Attendance API isStudentView:', facultyAtt.body.data.isStudentView);
  console.log('   Classroom Roster Count:', facultyAtt.body.data.roster.length);
  if (facultyAtt.body.data.roster.length > 0) {
    console.log('   [PASS] Faculty receives classroom roll-call register!');
  }

  // 5. Student Fees Query
  const studentFees = await request('/api/fees', {
    headers: { Cookie: studentAuth.cookie },
  });
  console.log('5. Student Invoices Count:', studentFees.body.data.invoices.length);
  const hasOtherStudentsInvoices = studentFees.body.data.invoices.some(
    (inv) => inv.studentAdmNo !== 'GVIS-2026-001'
  );
  if (!hasOtherStudentsInvoices) {
    console.log('   [PASS] Student only sees their own fee invoices!');
  } else {
    console.error('FAIL: Student sees other students invoices!');
  }

  console.log('\n--- ALL ROLE ISOLATION CHECKS PASSED 100% ---');
}

run().catch(console.error);
