'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import CommandPalette from '@/components/CommandPalette';
import MetricCard from '@/components/MetricCard';
import {
  CalendarCheck,
  Save,
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
  Check,
  ArrowRight,
  Building,
  RefreshCw,
  Users,
  UserCheck,
} from 'lucide-react';
import { AuthUser } from '@/types';
import { exportToExcel } from '@/lib/excel';

function AttendanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Sections & Query Filters
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>(searchParams.get('sectionId') || '');
  const [date, setDate] = useState<string>(searchParams.get('date') || new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(
    searchParams.get('period') ? parseInt(searchParams.get('period')!, 10) : 0
  );

  // Timetable & Classroom Metadata
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [activeSlot, setActiveSlot] = useState<any>(null);
  const [assignedRoom, setAssignedRoom] = useState<string>('Room 101');
  const [dayOfWeek, setDayOfWeek] = useState<string>('');

  // Class Teacher assignment status
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [classTeacherName, setClassTeacherName] = useState<string>('');

  // Roster & Live State
  const [roster, setRoster] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Real-time live sync indicators
  const [liveSyncingStudentId, setLiveSyncingStudentId] = useState<string | null>(null);
  const [lastLiveSyncTime, setLastLiveSyncTime] = useState<string>('');
  const [liveStatusText, setLiveStatusText] = useState<string>('Live Connected');

  const isStudent = user?.roles?.includes('STUDENT');

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

      if (currentUser?.roles?.includes('STUDENT')) {
        router.replace('/student/attendance');
        return;
      }

      // Teacher / Admin: Load sections
      const clsRes = await fetch('/api/academics/classes');
      if (clsRes.ok) {
        const classes = (await clsRes.json()).data;
        const allSecs: any[] = [];
        classes.forEach((c: any) => {
          c.sections.forEach((s: any) => {
            allSecs.push({ ...s, className: c.name });
          });
        });
        setSections(allSecs);

        let initialSecId = searchParams.get('sectionId');
        if (!initialSecId && currentUser) {
          const userFullName = `${currentUser.firstName} ${currentUser.lastName}`.toLowerCase().trim();
          const myAssigned = allSecs.find(
            (s) =>
              s.classTeacher?.id === currentUser.id ||
              (s.classTeacherName && s.classTeacherName.toLowerCase().trim() === userFullName)
          );
          if (myAssigned) {
            initialSecId = myAssigned.id;
          }
        }
        if (!initialSecId && allSecs.length > 0) {
          initialSecId = allSecs[0].id;
        }

        if (!selectedSection && initialSecId) {
          setSelectedSection(initialSecId);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRoster = async () => {
    if (!selectedSection || isStudent) return;
    try {
      const url = `/api/attendance?sectionId=${encodeURIComponent(selectedSection)}&date=${encodeURIComponent(date)}&period=${selectedPeriod}`;
      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        const data = d.data;
        setRoster(data.roster || []);
        setStats(data.stats || null);
        setAvailableSlots(data.availableSlots || []);
        setActiveSlot(data.activeSlot || null);
        setAssignedRoom(data.assignedRoom || 'Room 101');
        setDayOfWeek(data.dayOfWeek || '');
        setIsClassTeacher(Boolean(data.isClassTeacher));
        setClassTeacherName(data.classTeacherName || '');
        setLastLiveSyncTime(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Failed to load roster:', err);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    if (selectedSection && !isStudent) {
      loadRoster();
    }
  }, [selectedSection, date, selectedPeriod, isStudent]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Instant Live Toggle for single student
  const handleLiveStatusChange = async (studentId: string, nextStatus: string) => {
    // 1. Optimistic local update
    const previousRoster = [...roster];
    const updatedRoster = roster.map((r) =>
      r.studentId === studentId ? { ...r, status: nextStatus } : r
    );
    setRoster(updatedRoster);

    // Live recalculation of stats
    const total = updatedRoster.length;
    const present = updatedRoster.filter((r) => r.status === 'PRESENT').length;
    const absent = updatedRoster.filter((r) => r.status === 'ABSENT').length;
    const late = updatedRoster.filter((r) => r.status === 'LATE').length;
    const excused = updatedRoster.filter((r) => r.status === 'EXCUSED').length;
    setStats({
      total,
      present,
      absent,
      late,
      excused,
      percentage: total > 0 ? Math.round(((present + late) / total) * 100) : 100,
    });

    // 2. Persist live to backend immediately
    setLiveSyncingStudentId(studentId);
    setLiveStatusText('Syncing live...');

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: selectedSection,
          date,
          period: selectedPeriod,
          studentId,
          status: nextStatus,
          roomNumber: assignedRoom,
          subjectName: activeSlot?.subjectName || 'General Register',
        }),
      });

      if (!res.ok) {
        // Rollback on network failure
        setRoster(previousRoster);
      } else {
        const nowStr = new Date().toLocaleTimeString();
        setLastLiveSyncTime(nowStr);
        setLiveStatusText(`Live Synced at ${nowStr}`);
      }
    } catch (err) {
      console.error('Live sync error:', err);
      setRoster(previousRoster);
    } finally {
      setLiveSyncingStudentId(null);
    }
  };

  // Mark all present with live batch sync
  const markAllPresent = async () => {
    const updated = roster.map((r) => ({ ...r, status: 'PRESENT' }));
    setRoster(updated);
    setStats({
      total: updated.length,
      present: updated.length,
      absent: 0,
      late: 0,
      excused: 0,
      percentage: 100,
    });

    try {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: selectedSection,
          date,
          period: selectedPeriod,
          entries: updated.map((r) => ({ studentId: r.studentId, status: 'PRESENT' })),
          roomNumber: assignedRoom,
          subjectName: activeSlot?.subjectName || 'General Register',
        }),
      });
      const nowStr = new Date().toLocaleTimeString();
      setLastLiveSyncTime(nowStr);
      setLiveStatusText(`All marked present live at ${nowStr}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Full manual register save
  const handleSaveAttendance = async () => {
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: selectedSection,
          date,
          period: selectedPeriod,
          entries: roster.map((r) => ({ studentId: r.studentId, status: r.status })),
          roomNumber: assignedRoom,
          subjectName: activeSlot?.subjectName || 'General Register',
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        const nowStr = new Date().toLocaleTimeString();
        setLastLiveSyncTime(nowStr);
        setTimeout(() => setSavedSuccess(false), 3000);
        loadRoster();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
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
          Loading Live Attendance Register...
        </div>
      </div>
    );
  }

  const currentSectionName = sections.find((s) => s.id === selectedSection)?.className || 'Grade';
  const currentSecLetter = sections.find((s) => s.id === selectedSection)?.name || 'Section';

  return (
    <div className="app-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="main-content">
        <Topbar
          user={user}
          onOpenCommand={() => setIsCommandOpen(true)}
          title="Period-Wise Classroom Attendance"
          subtitle="Timetable Periods, Assigned Classrooms & Live Roll Call"
        />

        <div className="page-body animate-slide-up">
          {/* Header Title Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)', margin: 0 }}>
                  Attendance Register & Roll Call
                </h1>
                {/* Live Real-Time Updating Pulse Badge */}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    color: '#059669',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                  }}
                  title="Attendance changes are saved live in real-time"
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      backgroundColor: '#10b981',
                      boxShadow: '0 0 8px #10b981',
                    }}
                  />
                  <span>LIVE SYNC ACTIVE</span>
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                Record live student roll call by assigned timetable period, classroom, and date.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link
                href="/admin/timetable"
                className="btn btn-secondary"
                title="View or Adjust Weekly Timetable Periods"
              >
                <Clock size={15} />
                <span>Timetable Grid</span>
              </Link>
              <button
                onClick={() => {
                  const exportData = roster.map((r) => ({
                    'Roll Number': r.rollNumber,
                    'Admission Number': r.admissionNumber,
                    'Student Name': r.name,
                    'Date': date,
                    'Period': selectedPeriod > 0 ? `Period ${selectedPeriod}` : 'General Roll Call',
                    'Classroom': assignedRoom,
                    'Subject': activeSlot?.subjectName || 'General',
                    'Attendance Status': r.status,
                  }));
                  exportToExcel(exportData, `Attendance_${currentSectionName}_${date}_P${selectedPeriod}`);
                }}
                className="btn btn-secondary"
                title="Export Attendance to Microsoft Excel"
              >
                <Download size={15} />
                <span>Export Excel</span>
              </button>
              <button onClick={markAllPresent} className="btn btn-secondary" title="Mark all students present with instant live update">
                <CheckCircle2 size={16} />
                <span>Mark All Present</span>
              </button>
              <button
                onClick={handleSaveAttendance}
                className="btn btn-primary"
                disabled={saving}
              >
                <Save size={16} />
                <span>{saving ? 'Saving...' : 'Save Register'}</span>
              </button>
            </div>
          </div>

          {/* Controls: Class/Section, Date, and Period / Timetable Slot */}
          <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                {/* Section Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Class & Section:</span>
                  <select
                    className="select"
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    style={{ width: 'auto', minWidth: '200px', height: 36, fontSize: '13px' }}
                  >
                    {sections.map((s) => {
                      const isMySec =
                        user &&
                        s.classTeacherName &&
                        `${user.firstName} ${user.lastName}`.toLowerCase().trim() === s.classTeacherName.toLowerCase().trim();
                      return (
                        <option key={s.id} value={s.id}>
                          {s.className} - {s.name} {isMySec ? '⭐ [My Class]' : s.classTeacherName ? `(Incharge: ${s.classTeacherName})` : ''}
                        </option>
                      );
                    })}
                  </select>

                  {classTeacherName && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: '12px',
                        backgroundColor: isClassTeacher ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-surface-subtle)',
                        color: isClassTeacher ? '#059669' : 'var(--text-muted)',
                        border: isClassTeacher ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                      }}
                    >
                      <UserCheck size={14} />
                      <span>Class Teacher: <strong>{classTeacherName}</strong> {isClassTeacher ? '(You)' : ''}</span>
                    </div>
                  )}
                </div>

                {/* Date Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Date:</span>
                  <input
                    type="date"
                    className="input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{ width: 'auto', height: 36, fontSize: '13px' }}
                  />
                </div>

                {/* Timetable Period Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Period / Slot:</span>
                  <select
                    className="select"
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(parseInt(e.target.value, 10))}
                    style={{ width: 'auto', minWidth: '220px', height: 36, fontSize: '13px', fontWeight: 600 }}
                  >
                    <option value={0}>📋 Full-Day / General Roll Call</option>
                    {availableSlots.map((slot) => (
                      <option key={slot.id} value={slot.periodNumber}>
                        Period {slot.periodNumber}: {slot.subjectName} ({slot.roomNumber || 'Room'}) • {slot.startTime}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status & Last Synced Timestamp */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {lastLiveSyncTime && (
                  <span style={{ fontSize: '12px', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <RefreshCw size={12} className={liveSyncingStudentId ? 'animate-spin' : ''} />
                    <span>Updated Live: {lastLiveSyncTime}</span>
                  </span>
                )}

                {savedSuccess && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--status-success)', fontSize: '13px', fontWeight: 700 }}>
                    <CheckCircle2 size={16} />
                    <span>Register Saved!</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Assigned Classroom & Timetable Live Hero Banner */}
          <div
            className="card"
            style={{
              marginBottom: '20px',
              padding: '18px 22px',
              background: 'linear-gradient(135deg, var(--bg-surface) 60%, rgba(56, 189, 248, 0.08))',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0284c7',
                  }}
                >
                  <Building size={24} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="badge badge-info" style={{ fontWeight: 700 }}>
                      🏛️ Assigned Classroom: {assignedRoom}
                    </span>
                    <span className="badge badge-neutral">
                      {currentSectionName} - {currentSecLetter}
                    </span>
                    {dayOfWeek && (
                      <span style={{ fontSize: '12px', color: 'var(--text-subtle)', fontWeight: 600 }}>
                        {dayOfWeek}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                    {selectedPeriod > 0 ? (
                      <span>
                        Period {selectedPeriod}: {activeSlot?.subjectName || 'Scheduled Class'} ({activeSlot?.subjectCode || 'ACAD'})
                      </span>
                    ) : (
                      <span>Daily Section Register & Homeroom Roll Call</span>
                    )}
                  </div>

                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: 2 }}>
                    {selectedPeriod > 0 && activeSlot ? (
                      <span>
                        ⏰ {activeSlot.startTime} – {activeSlot.endTime} &nbsp;•&nbsp; 👨‍🏫 Instructor: <strong>{activeSlot.teacherName}</strong>
                      </span>
                    ) : (
                      <span>Homeroom Faculty Roll Call • Assigned Classroom: {assignedRoom}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Period Badges */}
              {availableSlots.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600, marginRight: 4 }}>
                    Today&apos;s Periods:
                  </span>
                  {availableSlots.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedPeriod(s.periodNumber)}
                      className={`btn btn-sm ${selectedPeriod === s.periodNumber ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '3px 9px', fontSize: '11.5px', fontWeight: 600 }}
                    >
                      P{s.periodNumber}: {s.subjectCode}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Live Attendance Metric KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            <MetricCard
              label="Enrolled in Classroom"
              value={stats?.total ?? roster.length}
              icon={CalendarCheck}
            />
            <MetricCard
              label="Present"
              value={stats?.present ?? roster.filter((r) => r.status === 'PRESENT').length}
              icon={CheckCircle2}
              trendPositive={true}
            />
            <MetricCard
              label="Absent"
              value={stats?.absent ?? roster.filter((r) => r.status === 'ABSENT').length}
              icon={XCircle}
            />
            <MetricCard
              label="Live Attendance Rate"
              value={`${stats?.percentage ?? 100}%`}
              icon={CalendarCheck}
              trend="Real-Time Calculated"
              trendPositive={(stats?.percentage ?? 100) >= 75}
            />
          </div>

          {/* Roll Call Table with Live Toggles */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Roll #</th>
                  <th style={{ width: '130px' }}>Admission #</th>
                  <th>Student Name</th>
                  <th>Classroom / Room</th>
                  <th style={{ width: '110px' }}>Status</th>
                  <th style={{ textAlign: 'right', minWidth: '280px' }}>
                    Live Quick Roll Call (Updates Instantly)
                  </th>
                </tr>
              </thead>
              <tbody>
                {roster.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No students enrolled in this section.
                    </td>
                  </tr>
                ) : (
                  roster.map((r) => {
                    const isSyncing = liveSyncingStudentId === r.studentId;

                    return (
                      <tr key={r.studentId}>
                        <td><strong>{r.rollNumber}</strong></td>
                        <td><span className="command-kbd">{r.admissionNumber}</span></td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{r.name}</div>
                        </td>
                        <td>
                          <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                            🏛️ {assignedRoom}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              r.status === 'PRESENT'
                                ? 'badge-success'
                                : r.status === 'ABSENT'
                                ? 'badge-danger'
                                : r.status === 'LATE'
                                ? 'badge-warning'
                                : 'badge-info'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
                            {['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleLiveStatusChange(r.studentId, st)}
                                className={`btn btn-sm ${r.status === st ? 'btn-primary' : 'btn-secondary'}`}
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  border: r.status === st ? undefined : '1px solid var(--border-subtle)',
                                }}
                                title={`Click to mark ${r.name} as ${st} (updates live)`}
                              >
                                {st}
                              </button>
                            ))}
                            {isSyncing && (
                              <span style={{ fontSize: '11px', color: '#10b981', marginLeft: 4 }}>
                                ↻
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        isSuperAdmin={user?.isSuperAdmin}
      />
    </div>
  );
}

export default function AttendancePage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>
            Loading Live Attendance Register...
          </div>
        </div>
      }
    >
      <AttendanceContent />
    </Suspense>
  );
}
