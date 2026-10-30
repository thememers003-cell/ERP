'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GraduationCap,
  Users,
  CalendarCheck,
  FileText,
  Award,
  CreditCard,
  Building2,
  Shield,
  Settings,
  Layers,
  LogOut,
  Calendar,
  Clock,
  CheckSquare,
  BarChart3,
  BookOpen,
} from 'lucide-react';
import { AuthUser } from '@/types';

interface SidebarProps {
  user: AuthUser | null;
  onLogout: () => void;
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const isSuperAdmin = !!user?.isSuperAdmin;
  const roles = user?.roles || [];
  const isStudent = roles.includes('STUDENT');
  const isTeacher = !isSuperAdmin && !isStudent && roles.some((r) =>
    ['SUBJECT_TEACHER', 'JUNIOR_MATH_TEACHER', 'TEACHER', 'HOD'].includes(r)
  );
  const isAdmin = isSuperAdmin || (!isStudent && !isTeacher) || roles.some((r) =>
    ['SCHOOL_OWNER', 'PRINCIPAL', 'ADMIN', 'ACCOUNTANT'].includes(r)
  );

  const enabledModules = user?.enabledModules || [];
  const isModuleActive = (modKey: string) => {
    if (isSuperAdmin) return true;
    return enabledModules.includes(modKey);
  };

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--brand-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '18px',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          {user?.schoolCode ? user.schoolCode.slice(0, 2) : 'NE'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontSize: '14.5px',
              fontWeight: 700,
              color: 'var(--text-main)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              letterSpacing: '-0.01em',
            }}
          >
            {user?.schoolName || 'NexEdu Platform'}
          </h1>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {isSuperAdmin ? (
              <span className="badge badge-info" style={{ padding: '1px 6px', fontSize: '10px' }}>Super Admin</span>
            ) : isStudent ? (
              <span className="badge badge-success" style={{ padding: '1px 6px', fontSize: '10px' }}>Student Portal</span>
            ) : isTeacher ? (
              <span className="badge badge-warning" style={{ padding: '1px 6px', fontSize: '10px' }}>Faculty Portal</span>
            ) : (
              <span className="badge badge-neutral" style={{ padding: '1px 6px', fontSize: '10px' }}>
                {roles[0] ? roles[0].replace(/_/g, ' ') : 'Administrator'}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Nav List */}
      <div className="sidebar-nav">
        {/* SUPER ADMIN PLATFORM SECTION */}
        {isSuperAdmin && (
          <div>
            <div className="nav-group-title">Platform OS</div>
            <Link
              href="/super-admin"
              className={`nav-item ${pathname === '/super-admin' ? 'active' : ''}`}
            >
              <Shield size={17} />
              <span>Tenants & Analytics</span>
            </Link>
          </div>
        )}

        {/* ======================================================== */}
        {/* STUDENT DEDICATED NAV */}
        {/* ======================================================== */}
        {isStudent && (
          <div>
            <div className="nav-group-title">My Learning Portal</div>
            <Link
              href="/student"
              className={`nav-item ${pathname === '/student' ? 'active' : ''}`}
            >
              <BarChart3 size={17} />
              <span>Student Home</span>
            </Link>
            <Link
              href="/homework"
              className={`nav-item ${pathname === '/homework' ? 'active' : ''}`}
            >
              <BookOpen size={17} />
              <span>School Diary & Tasks</span>
            </Link>
            <Link
              href="/student/attendance"
              className={`nav-item ${pathname === '/student/attendance' || pathname === '/attendance' ? 'active' : ''}`}
            >
              <CalendarCheck size={17} />
              <span>My Attendance</span>
            </Link>
            <Link
              href="/exams"
              className={`nav-item ${pathname === '/exams' ? 'active' : ''}`}
            >
              <Award size={17} />
              <span>My Exam Grades</span>
            </Link>
            <Link
              href="/student/timetable"
              className={`nav-item ${pathname === '/student/timetable' ? 'active' : ''}`}
            >
              <Clock size={17} />
              <span>Class Timetable</span>
            </Link>
            <Link
              href="/calendar"
              className={`nav-item ${pathname === '/calendar' ? 'active' : ''}`}
            >
              <Calendar size={17} />
              <span>Academic Calendar</span>
            </Link>
            <Link
              href="/fees"
              className={`nav-item ${pathname === '/fees' ? 'active' : ''}`}
            >
              <CreditCard size={17} />
              <span>Fee Statements</span>
            </Link>
          </div>
        )}

        {/* ======================================================== */}
        {/* FACULTY DEDICATED NAV */}
        {/* ======================================================== */}
        {isTeacher && (
          <div>
            <div className="nav-group-title">Faculty Desk</div>
            <Link
              href="/faculty"
              className={`nav-item ${pathname === '/faculty' ? 'active' : ''}`}
            >
              <BarChart3 size={17} />
              <span>Faculty Dashboard</span>
            </Link>
            <Link
              href="/attendance"
              className={`nav-item ${pathname === '/attendance' ? 'active' : ''}`}
            >
              <CalendarCheck size={17} />
              <span>Take Attendance</span>
            </Link>
            <Link
              href="/homework"
              className={`nav-item ${pathname === '/homework' ? 'active' : ''}`}
            >
              <BookOpen size={17} />
              <span>Diary & Homework</span>
            </Link>
            <Link
              href="/exams"
              className={`nav-item ${pathname === '/exams' ? 'active' : ''}`}
            >
              <Award size={17} />
              <span>Gradebook Entry</span>
            </Link>
            <Link
              href="/leaves"
              className={`nav-item ${pathname === '/leaves' ? 'active' : ''}`}
            >
              <Clock size={17} />
              <span>Apply Leave</span>
            </Link>
            <Link
              href="/admin/timetable"
              className={`nav-item ${pathname === '/admin/timetable' ? 'active' : ''}`}
            >
              <Clock size={17} />
              <span>Weekly Timetable</span>
            </Link>
            <Link
              href="/calendar"
              className={`nav-item ${pathname === '/calendar' ? 'active' : ''}`}
            >
              <Calendar size={17} />
              <span>Academic Calendar</span>
            </Link>
          </div>
        )}

        {/* ======================================================== */}
        {/* ADMIN / SCHOOL OWNER FULL SUITE */}
        {/* ======================================================== */}
        {isAdmin && !isStudent && !isTeacher && (
          <>
            <div>
              <div className="nav-group-title">Institutional Management</div>
              <Link
                href="/admin"
                className={`nav-item ${pathname === '/admin' ? 'active' : ''}`}
              >
                <BarChart3 size={17} />
                <span>Executive Overview</span>
              </Link>
            </div>

            <div>
              <div className="nav-group-title">People Directory</div>
              <Link
                href="/students"
                className={`nav-item ${pathname === '/students' ? 'active' : ''}`}
              >
                <Users size={17} />
                <span>Students</span>
              </Link>
              <Link
                href="/teachers"
                className={`nav-item ${pathname === '/teachers' ? 'active' : ''}`}
              >
                <Users size={17} />
                <span>Faculty & Staff</span>
              </Link>
            </div>

            <div>
              <div className="nav-group-title">Academics & Operations</div>
              <Link
                href="/attendance"
                className={`nav-item ${pathname === '/attendance' ? 'active' : ''}`}
              >
                <CalendarCheck size={17} />
                <span>Attendance Register</span>
              </Link>
              <Link
                href="/homework"
                className={`nav-item ${pathname === '/homework' ? 'active' : ''}`}
              >
                <BookOpen size={17} />
                <span>Diary & Homework Studio</span>
              </Link>
              <Link
                href="/exams"
                className={`nav-item ${pathname === '/exams' ? 'active' : ''}`}
              >
                <Award size={17} />
                <span>Exams & Gradebook</span>
              </Link>
              <Link
                href="/admin/departments"
                className={`nav-item ${pathname === '/admin/departments' ? 'active' : ''}`}
              >
                <Building2 size={17} />
                <span>Departments & HODs</span>
              </Link>
              <Link
                href="/admin/classes"
                className={`nav-item ${pathname === '/admin/classes' ? 'active' : ''}`}
              >
                <GraduationCap size={17} />
                <span>Classes & Subjects</span>
              </Link>
              <Link
                href="/admin/timetable"
                className={`nav-item ${pathname === '/admin/timetable' ? 'active' : ''}`}
              >
                <Clock size={17} />
                <span>Timetable & Faculty</span>
              </Link>
              <Link
                href="/leaves"
                className={`nav-item ${pathname === '/leaves' ? 'active' : ''}`}
              >
                <Clock size={17} />
                <span>Staff Leave Approvals</span>
              </Link>
              <Link
                href="/calendar"
                className={`nav-item ${pathname === '/calendar' ? 'active' : ''}`}
              >
                <Calendar size={17} />
                <span>Academic Calendar</span>
              </Link>
            </div>

            <div>
              <div className="nav-group-title">Finance & Billing</div>
              <Link
                href="/fees"
                className={`nav-item ${pathname === '/fees' ? 'active' : ''}`}
              >
                <CreditCard size={17} />
                <span>Fees & Invoices</span>
              </Link>
            </div>

            <div>
              <div className="nav-group-title">Security & System</div>
              <Link
                href="/admin/roles"
                className={`nav-item ${pathname === '/admin/roles' ? 'active' : ''}`}
              >
                <Shield size={17} />
                <span>Role Builder & Matrix</span>
              </Link>
              <Link
                href="/admin/settings"
                className={`nav-item ${pathname === '/admin/settings' ? 'active' : ''}`}
              >
                <Settings size={17} />
                <span>Modules & Branding</span>
              </Link>
              <Link
                href="/admin/audit"
                className={`nav-item ${pathname === '/admin/audit' ? 'active' : ''}`}
              >
                <Layers size={17} />
                <span>Audit Trail Ledger</span>
              </Link>
            </div>
          </>
        )}
      </div>

      {/* User Footer Profile */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-surface-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: 'var(--brand-primary-light)',
              color: 'var(--brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '13px',
            }}
          >
            {user?.firstName ? user.firstName[0] : 'U'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-main)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.email}
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          title="Sign out"
          className="btn-icon"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
