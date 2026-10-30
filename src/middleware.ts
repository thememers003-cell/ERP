import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    if (parsed.exp && Date.now() >= parsed.exp * 1000) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static resources and Next.js internal files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('nexedu_token')?.value;
  const payload = token ? decodeJwtPayload(token) : null;

  // Unauthenticated user flow
  if (!payload) {
    if (pathname === '/login') {
      return NextResponse.next();
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Determine user's assigned portal
  const roles: string[] = Array.isArray(payload.roles) ? payload.roles : [];
  const isSuperAdmin = !!payload.isSuperAdmin && !payload.impersonatedSchoolId;
  const isStudent = roles.includes('STUDENT') || roles.includes('PARENT');
  const isFaculty =
    !isStudent &&
    roles.some((r) =>
      ['TEACHER', 'SUBJECT_TEACHER', 'JUNIOR_MATH_TEACHER', 'HOD', 'FACULTY'].includes(r)
    );
  const isAdmin = isSuperAdmin || (!isStudent && !isFaculty);

  let targetPortal = '/admin';
  if (isSuperAdmin) {
    targetPortal = '/super-admin';
  } else if (isStudent) {
    targetPortal = '/student';
  } else if (isFaculty) {
    targetPortal = '/faculty';
  }

  // If already logged in and visiting /login or root /, redirect to designated portal
  if (pathname === '/login' || pathname === '/') {
    return NextResponse.redirect(new URL(targetPortal, request.url));
  }

  // 1. Student portal boundary: /student or /student/*
  if (pathname === '/student' || pathname.startsWith('/student/')) {
    if (!isStudent) {
      // Non-students (Faculty or Admin) opening /student are routed to their own portal
      return NextResponse.redirect(new URL(targetPortal, request.url));
    }
    return NextResponse.next();
  }

  // 2. Faculty portal boundary: /faculty or /faculty/*
  if (pathname === '/faculty' || pathname.startsWith('/faculty/')) {
    if (!isFaculty) {
      // Non-faculty (Student or Admin) opening /faculty are routed to their own portal
      return NextResponse.redirect(new URL(targetPortal, request.url));
    }
    return NextResponse.next();
  }

  // 3. Super Admin portal boundary: /super-admin or /super-admin/*
  if (pathname === '/super-admin' || pathname.startsWith('/super-admin/')) {
    if (!payload.isSuperAdmin) {
      return NextResponse.redirect(new URL(targetPortal, request.url));
    }
    return NextResponse.next();
  }

  // 4. Admin portal and management directories: /admin/*, /students, /teachers
  if (
    pathname.startsWith('/admin') ||
    pathname === '/students' ||
    pathname === '/teachers'
  ) {
    if (isStudent) {
      // Student attempting to open admin or faculty areas gets redirected to /student
      return NextResponse.redirect(new URL('/student', request.url));
    }
    if (isFaculty) {
      // Faculty allowed to view timetable, but redirected away from admin management
      if (pathname !== '/admin/timetable') {
        return NextResponse.redirect(new URL('/faculty', request.url));
      }
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/student/:path*',
    '/faculty/:path*',
    '/admin/:path*',
    '/super-admin/:path*',
    '/teachers/:path*',
    '/students/:path*',
  ],
};
