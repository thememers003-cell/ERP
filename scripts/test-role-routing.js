const http = require('http');

async function login(email, password) {
  const res = await fetch('http://127.0.0.1:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const cookie = res.headers.get('set-cookie');
  const data = await res.json();
  return { status: res.status, cookie, data };
}

async function get(path, cookie) {
  const headers = {};
  if (cookie) headers['cookie'] = cookie;
  const res = await fetch(`http://127.0.0.1:3000${path}`, {
    headers,
    redirect: 'manual', // do not follow redirect so we can inspect status 307 / 308 / 302 and Location header
  });
  return {
    status: res.status,
    location: res.headers.get('location'),
  };
}

async function run() {
  console.log('====================================================');
  console.log('   TESTING ROLE-BASED ACCESS CONTROL & ROUTING');
  console.log('====================================================\n');

  // 1. Unauthenticated checks
  console.log('--- 1. Unauthenticated Access Protection ---');
  const unauthAdmin = await get('/admin');
  console.log(`GET /admin -> Status: ${unauthAdmin.status}, Redirect: ${unauthAdmin.location}`);
  const unauthFaculty = await get('/faculty');
  console.log(`GET /faculty -> Status: ${unauthFaculty.status}, Redirect: ${unauthFaculty.location}`);
  const unauthStudent = await get('/student');
  console.log(`GET /student -> Status: ${unauthStudent.status}, Redirect: ${unauthStudent.location}`);

  // 2. Student Role
  console.log('\n--- 2. Student Role Verification (Aarav Patel) ---');
  const student = await login('aarav.patel@student.greenvalley.edu', 'password123');
  console.log(`Student Login Redirect: ${student.data.data.redirectUrl}`);
  
  const studentAtStudent = await get('/student', student.cookie);
  console.log(`Student accessing /student -> Status: ${studentAtStudent.status} (Allowed)`);

  const studentAtFaculty = await get('/faculty', student.cookie);
  console.log(`Student accessing /faculty -> Status: ${studentAtFaculty.status}, Redirect: ${studentAtFaculty.location} (Protected)`);

  const studentAtAdmin = await get('/admin', student.cookie);
  console.log(`Student accessing /admin -> Status: ${studentAtAdmin.status}, Redirect: ${studentAtAdmin.location} (Protected)`);

  // 3. Faculty Role
  console.log('\n--- 3. Faculty Role Verification (Dr. Rajesh Sharma) ---');
  const faculty = await login('dr.sharma@greenvalley.edu', 'password123');
  console.log(`Faculty Login Redirect: ${faculty.data.data.redirectUrl}`);

  const facultyAtFaculty = await get('/faculty', faculty.cookie);
  console.log(`Faculty accessing /faculty -> Status: ${facultyAtFaculty.status} (Allowed)`);

  const facultyAtStudent = await get('/student', faculty.cookie);
  console.log(`Faculty accessing /student -> Status: ${facultyAtStudent.status}, Redirect: ${facultyAtStudent.location} (Protected)`);

  const facultyAtAdmin = await get('/admin', faculty.cookie);
  console.log(`Faculty accessing /admin -> Status: ${facultyAtAdmin.status}, Redirect: ${facultyAtAdmin.location} (Protected)`);

  // 4. Admin Role
  console.log('\n--- 4. Admin Role Verification (School Owner) ---');
  const admin = await login('owner@greenvalley.edu', 'password123');
  console.log(`Admin Login Redirect: ${admin.data.data.redirectUrl}`);

  const adminAtAdmin = await get('/admin', admin.cookie);
  console.log(`Admin accessing /admin -> Status: ${adminAtAdmin.status} (Allowed)`);

  const adminAtStudent = await get('/student', admin.cookie);
  console.log(`Admin accessing /student -> Status: ${adminAtStudent.status}, Redirect: ${adminAtStudent.location} (Protected)`);

  const adminAtFaculty = await get('/faculty', admin.cookie);
  console.log(`Admin accessing /faculty -> Status: ${adminAtFaculty.status}, Redirect: ${adminAtFaculty.location} (Protected)`);

  console.log('\n====================================================');
  console.log('   ALL ROUTE ISOLATION CHECKS COMPLETED!');
  console.log('====================================================');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
