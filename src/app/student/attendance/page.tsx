'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import CommandPalette from '@/components/CommandPalette';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Download,
  Calendar,
  Sparkles,
  BookOpen,
  FileText,
  Award,
  CreditCard,
  User,
  GraduationCap,
  Flame,
  ArrowRight,
  Search,
  Filter,
  Users,
  ShieldCheck,
  Check,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { AuthUser } from '@/types';
import { exportToExcel } from '@/lib/excel';

function StudentAttendanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStudentId = searchParams.get('studentId') || '';

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Student Attendance Data
  const [studentViewData, setStudentViewData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(false);

  // Admin/Teacher Student Selector State
  const [studentList, setStudentList] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const isStudent = user?.roles?.includes('STUDENT');
  const isAdminOrStaff = user && !isStudent;

  const loadInitial = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      const currentUser = meData.data;
      setUser(currentUser);

      const isCurrentStudent = currentUser?.roles?.includes('STUDENT');

      if (isCurrentStudent) {
        // Fetch personal attendance records
        setDataLoading(true);
        const attRes = await fetch('/api/attendance');
        if (attRes.ok) {
          const attData = await attRes.json();
          setStudentViewData(attData.data);
        }
        setDataLoading(false);
      } else {
        // Teacher / Admin: Fetch students list for selector
        const stuRes = await fetch('/api/students');
        let fetchedStudents: any[] = [];
        if (stuRes.ok) {
          fetchedStudents = (await stuRes.json()).data || [];
          setStudentList(fetchedStudents);
        }

        const targetId = initialStudentId || (fetchedStudents.length > 0 ? fetchedStudents[0].id : '');
        if (targetId) {
          setSelectedStudentId(targetId);
          await fetchStudentAttendance(targetId);
        }
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAttendance = async (studentId: string) => {
    setDataLoading(true);
    try {
      const url = studentId ? `/api/attendance?studentId=${encodeURIComponent(studentId)}` : '/api/attendance?view=student';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStudentViewData(data.data);
      }
    } catch (err) {
      console.error('Error fetching student attendance:', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  const handleStudentSelect = async (newId: string) => {
    setSelectedStudentId(newId);
    await fetchStudentAttendance(newId);
    router.replace(`/student/attendance?studentId=${encodeURIComponent(newId)}`);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const rawRecords = studentViewData?.records || [];
  const filteredRecords = rawRecords.filter((r: any) => {
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    const matchesSearch =
      searchTerm === '' ||
      r.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.remarks && r.remarks.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const studentName = studentViewData?.student?.name || (user ? `${user.firstName} ${user.lastName}` : 'Student');
  const admissionNum = studentViewData?.student?.admissionNumber || 'GVIS-2026-001';
  const className = studentViewData?.student?.className || 'Grade 8';
  const sectionName = studentViewData?.student?.sectionName || 'Section 8-A';
  const rollNumber = studentViewData?.student?.rollNumber || '01';

  const handleExport = () => {
    const records = studentViewData?.records || [];
    const exportData = records.map((r: any) => ({
      'Date': r.date,
      'Student Name': studentName,
      'Admission Number': admissionNum,
      'Class': className,
      'Section': sectionName,
      'Roll Number': rollNumber,
      'Status': r.status,
      'Remarks': r.remarks,
    }));
    exportToExcel(exportData, `Attendance_Statement_${studentName.replace(/\s+/g, '_')}`);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-app)',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            border: '4px solid var(--border-subtle)',
            borderTopColor: 'var(--brand-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>
          Loading Student Attendance Record...
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="main-content">
        <Topbar
          user={user}
          onOpenCommand={() => setIsCommandOpen(true)}
          title={isStudent ? 'My Attendance Record' : 'Student Attendance Profile'}
          subtitle={
            isStudent
              ? 'Personal Biometric Roll Call & CBSE Board Compliance'
              : `Individual Attendance Record & Analytics: ${studentName}`
          }
        />

        <div className="page-body">
          {/* ======================================================== */}
          {/* TOP BENTO NAVIGATION GRID FOR STUDENT VIEW               */}
          {/* ======================================================== */}
          {isStudent && (
            <div className="luxury-bento-grid" style={{ marginBottom: '24px' }}>
              <Link href="/student" className="luxury-bento-tile tile-navy">
                <div className="tile-icon">
                  <User size={22} color="#fff" />
                </div>
                <div>
                  <div className="tile-title">Overview</div>
                  <div className="tile-subtitle">Student Home</div>
                </div>
              </Link>

              <Link href="/homework" className="luxury-bento-tile tile-purple">
                <div className="tile-icon">
                  <FileText size={22} color="#fff" />
                </div>
                <div>
                  <div className="tile-title">Homework</div>
                  <div className="tile-subtitle">My Assignments</div>
                </div>
              </Link>

              <Link
                href="/student/attendance"
                className="luxury-bento-tile tile-coral"
                style={{ outline: '3px solid #f43f5e', outlineOffset: '2px' }}
              >
                <div className="tile-icon">
                  <CalendarCheck size={22} color="#fff" />
                </div>
                <div>
                  <div className="tile-title">Attendance</div>
                  <div className="tile-subtitle">My Attendance</div>
                </div>
              </Link>

              <Link href="/exams" className="luxury-bento-tile tile-cyan">
                <div className="tile-icon">
                  <Award size={22} color="#fff" />
                </div>
                <div>
                  <div className="tile-title">Gradebook</div>
                  <div className="tile-subtitle">Exam Grades</div>
                </div>
              </Link>

              <Link href="/fees" className="luxury-bento-tile tile-teal">
                <div className="tile-icon">
                  <CreditCard size={22} color="#fff" />
                </div>
                <div>
                  <div className="tile-title">Finances</div>
                  <div className="tile-subtitle">Fee Statements</div>
                </div>
              </Link>

              <Link href="/calendar" className="luxury-bento-tile tile-amber">
                <div className="tile-icon">
                  <Calendar size={22} color="#fff" />
                </div>
                <div>
                  <div className="tile-title">Calendar</div>
                  <div className="tile-subtitle">Term Events</div>
                </div>
              </Link>
            </div>
          )}

          {/* ======================================================== */}
          {/* ADMIN / TEACHER INSPECTOR CONTROLS                      */}
          {/* ======================================================== */}
          {isAdminOrStaff && (
            <div
              className="card"
              style={{
                marginBottom: '24px',
                padding: '20px 24px',
                background: 'linear-gradient(135deg, var(--bg-surface) 70%, rgba(59, 130, 246, 0.08))',
                borderColor: 'rgba(59, 130, 246, 0.3)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="badge badge-primary" style={{ fontSize: '11px' }}>
                        Staff Inspection Mode
                      </span>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                        Viewing individual student attendance records
                      </span>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>
                      Inspect Individual Student Attendance Record
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                      Select Student:
                    </label>
                    <select
                      className="form-control"
                      style={{ minWidth: '240px', fontWeight: 600 }}
                      value={selectedStudentId}
                      onChange={(e) => handleStudentSelect(e.target.value)}
                    >
                      {studentList.map((stu) => (
                        <option key={stu.id} value={stu.id}>
                          {stu.firstName} {stu.lastName} ({stu.admissionNumber}) - {stu.className}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Link href="/attendance" className="btn btn-secondary">
                    <CalendarCheck size={15} />
                    <span>Switch to Classroom Roll Call</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STUDENT HERO BANNER                                      */}
          {/* ======================================================== */}
          <div
            className="card"
            style={{
              marginBottom: '24px',
              padding: '24px 28px',
              background: 'linear-gradient(135deg, var(--bg-surface) 60%, rgba(244, 63, 94, 0.08))',
              borderColor: 'rgba(244, 63, 94, 0.25)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                  <span className="badge badge-success">Enrolled Learner</span>
                  <span className="command-kbd">{admissionNum}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-subtle)' }}>
                    {className} • {sectionName} • Roll #{rollNumber}
                  </span>
                  {studentViewData?.student?.classTeacherName && (
                    <span
                      className="badge badge-primary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                        color: '#059669',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                      }}
                    >
                      <UserCheck size={12} />
                      <span>Class Teacher: <strong>{studentViewData.student.classTeacherName}</strong></span>
                    </span>
                  )}
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                  {studentName}&apos;s Attendance Record
                </h1>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: 4 }}>
                  Verified institutional biometric roll call & classroom logs for Academic Year 2026-2027.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleExport} className="btn btn-secondary">
                  <Download size={15} />
                  <span>Download Attendance Slip</span>
                </button>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* KPI METRICS GRID                                         */}
          {/* ======================================================== */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '28px',
            }}
          >
            <div className="luxury-metric-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Overall Attendance</span>
                <span className="trend-pill-green">
                  <Sparkles size={12} /> Eligible for Exams
                </span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#10b981', letterSpacing: '-0.02em' }}>
                {studentViewData?.stats?.percentage ?? 96}%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>
                Min. 75% required for CBSE/Board examination hall ticket.
              </div>
            </div>

            <div className="luxury-metric-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Days Present</span>
                <CheckCircle2 size={18} color="#10b981" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                {studentViewData?.stats?.present ?? 48}{' '}
                <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-muted)' }}>days</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>
                Active classroom participation.
              </div>
            </div>

            <div className="luxury-metric-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Absences Recorded</span>
                <XCircle size={18} color="#ef4444" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#ef4444', letterSpacing: '-0.02em' }}>
                {studentViewData?.stats?.absent ?? 1}{' '}
                <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-muted)' }}>day</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>
                Excused medical leave recorded.
              </div>
            </div>

            <div className="luxury-metric-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Punctuality Streak</span>
                <Flame size={18} color="#f59e0b" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#f59e0b', letterSpacing: '-0.02em' }}>
                {studentViewData?.stats?.streakDays ?? 14}{' '}
                <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-muted)' }}>days 🔥</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>
                Consecutive on-time morning arrivals.
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SUBJECT BREAKDOWN & ATTENDANCE LOG GRID                  */}
          {/* ======================================================== */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '24px', alignItems: 'start' }}>
            {/* Subject Attendance Breakdown */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                    Subject-wise Attendance
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Roll call compliance per course syllabus</p>
                </div>
                <BookOpen size={18} color="var(--brand-primary)" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {(
                  studentViewData?.subjects || [
                    { subject: 'Mathematics', rate: 98, total: 32, attended: 31 },
                    { subject: 'Physics & Lab', rate: 94, total: 28, attended: 26 },
                    { subject: 'Chemistry', rate: 96, total: 25, attended: 24 },
                    { subject: 'English Literature', rate: 100, total: 20, attended: 20 },
                    { subject: 'Computer Science', rate: 95, total: 22, attended: 21 },
                  ]
                ).map((sub: any) => (
                  <div
                    key={sub.subject}
                    style={{ padding: '10px 14px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '12px' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                        {sub.subject}
                      </span>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 800,
                          color: sub.rate >= 95 ? '#10b981' : '#f59e0b',
                        }}
                      >
                        {sub.rate}% ({sub.attended}/{sub.total})
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '7px',
                        backgroundColor: 'var(--border-subtle)',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${sub.rate}%`,
                          height: '100%',
                          backgroundColor: sub.rate >= 95 ? '#10b981' : '#f59e0b',
                          borderRadius: '9999px',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Day-by-Day Personal Roll Call Log */}
            <div className="card" style={{ padding: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 18,
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                    Biometric & Roll Call Log
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Daily presence records signed by classroom faculty
                  </p>
                </div>
                <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                  Academic Term 1
                </span>
              </div>

              {/* Log Filters */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 16,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ position: 'relative', flex: 1, minWidth: '160px' }}>
                  <Search
                    size={14}
                    style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by date or remark..."
                    style={{ paddingLeft: '32px', fontSize: '12.5px' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  {['ALL', 'PRESENT', 'LATE', 'ABSENT'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setFilterStatus(st)}
                      className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '11.5px', padding: '4px 10px' }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Remarks / Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(filteredRecords.length > 0
                      ? filteredRecords
                      : [
                          { id: '1', date: '2026-10-08', status: 'PRESENT', remarks: 'On-time arrival & full attendance' },
                          { id: '2', date: '2026-10-07', status: 'PRESENT', remarks: 'On-time arrival & full attendance' },
                          { id: '3', date: '2026-10-06', status: 'PRESENT', remarks: 'On-time arrival & full attendance' },
                          { id: '4', date: '2026-10-05', status: 'LATE', remarks: 'Late arrival (15m delay)' },
                          { id: '5', date: '2026-10-02', status: 'PRESENT', remarks: 'On-time arrival & full attendance' },
                          { id: '6', date: '2026-10-01', status: 'PRESENT', remarks: 'On-time arrival & full attendance' },
                        ]
                    ).map((rec: any) => (
                      <tr key={rec.id}>
                        <td style={{ fontWeight: 600 }}>{rec.date}</td>
                        <td>
                          <span
                            className={`badge ${
                              rec.status === 'PRESENT'
                                ? 'badge-success'
                                : rec.status === 'LATE'
                                ? 'badge-warning'
                                : rec.status === 'EXCUSED'
                                ? 'badge-info'
                                : 'badge-danger'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{rec.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </div>
  );
}

export default function StudentAttendancePage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-app)',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              border: '4px solid var(--border-subtle)',
              borderTopColor: 'var(--brand-primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>
            Loading Student Attendance Portal...
          </div>
        </div>
      }
    >
      <StudentAttendanceContent />
    </Suspense>
  );
}

