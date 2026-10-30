'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import CommandPalette from '@/components/CommandPalette';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Award,
  CalendarCheck,
  BookOpen,
  User,
  FileText,
  CreditCard,
  Sparkles,
  MapPin,
  PartyPopper,
} from 'lucide-react';
import { AuthUser } from '@/types';

export default function AcademicCalendarPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1)); // Default to October 2026
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'STAFF_LEAVE' | 'EXAM' | 'HOLIDAY' | 'ACADEMIC'>('ALL');

  const isStudent = user?.roles?.includes('STUDENT') || user?.roles?.includes('PARENT');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((d) => {
        if (d.success) setUser(d.data);
      });
  }, []);

  const loadCalendarEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await fetch('/api/calendar');
      const data = await res.json();
      if (data.success) {
        setEvents(data.data);
      }
    } catch (err) {
      console.error('Failed to load calendar events', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    loadCalendarEvents();
  }, [currentDate]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Days in month calculation
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Filter events for this month
  const currentMonthEvents = events.filter((e) => {
    const matchesMonth = e.month === month && (e.year ? e.year === year : true);
    if (!matchesMonth) return false;
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'ACADEMIC') return e.type === 'ACADEMIC' || e.type === 'EVENT' || e.type === 'MEETING';
    return e.type === selectedFilter;
  });

  const staffLeavesCount = events.filter((e) => e.type === 'STAFF_LEAVE' && e.month === month).length;
  const examsCount = events.filter((e) => e.type === 'EXAM' && e.month === month).length;
  const holidaysCount = events.filter((e) => e.type === 'HOLIDAY' && e.month === month).length;
  const academicCount = events.filter(
    (e) => (e.type === 'ACADEMIC' || e.type === 'EVENT' || e.type === 'MEETING') && e.month === month
  ).length;

  return (
    <div className="app-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="main-content">
        <Topbar
          user={user}
          onOpenCommand={() => setIsCommandOpen(true)}
          title="Academic Calendar"
          subtitle={
            isStudent
              ? 'Official Examination Dates, Campus Holidays & Academic Milestones'
              : 'Schedules, Faculty Leaves & Institutional Campus Events'
          }
        />

        <div className="page-body">
          {/* ======================================================== */}
          {/* STUDENT BENTO QUICK NAVIGATION                           */}
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

              <Link href="/student/attendance" className="luxury-bento-tile tile-coral">
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

              <Link
                href="/calendar"
                className="luxury-bento-tile tile-amber"
                style={{ outline: '3px solid #f59e0b', outlineOffset: '2px' }}
              >
                <div className="tile-icon">
                  <CalendarIcon size={22} color="#fff" />
                </div>
                <div>
                  <div className="tile-title">Calendar</div>
                  <div className="tile-subtitle">Academic Events</div>
                </div>
              </Link>
            </div>
          )}

          {/* ======================================================== */}
          {/* HEADER ACTION TOOLBAR                                    */}
          {/* ======================================================== */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: 14,
            }}
          >
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                {isStudent ? 'Academic Year 2026-2027 Schedule' : 'Institutional Calendar & Events'}
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {isStudent
                  ? 'Official CBSE term examinations, national holidays, project deadlines and PTM conferences.'
                  : 'Track class timetables, examination sessions, campus events, and approved faculty leave dates.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              {isStudent ? (
                <Link href="/exams" className="btn btn-secondary">
                  <Award size={16} />
                  <span>View Exam Schedules</span>
                </Link>
              ) : (
                <Link href="/leaves" className="btn btn-primary">
                  <Clock size={16} />
                  <span>Leave Management & Quotas</span>
                </Link>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* FILTER BAR                                               */}
          {/* ======================================================== */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>Filter:</span>
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`btn btn-sm ${selectedFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            >
              All Events ({currentMonthEvents.length})
            </button>

            {/* ONLY FACULTY & ADMIN SEE FACULTY LEAVES FILTER */}
            {!isStudent && (
              <button
                onClick={() => setSelectedFilter('STAFF_LEAVE')}
                className={`btn btn-sm ${selectedFilter === 'STAFF_LEAVE' ? 'btn-danger' : 'btn-secondary'}`}
                style={selectedFilter === 'STAFF_LEAVE' ? { backgroundColor: '#ef4444', borderColor: '#ef4444' } : {}}
              >
                Approved Faculty Leaves ({staffLeavesCount})
              </button>
            )}

            <button
              onClick={() => setSelectedFilter('EXAM')}
              className={`btn btn-sm ${selectedFilter === 'EXAM' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Examinations ({examsCount})
            </button>

            <button
              onClick={() => setSelectedFilter('HOLIDAY')}
              className={`btn btn-sm ${selectedFilter === 'HOLIDAY' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Holidays & Vacations ({holidaysCount})
            </button>

            <button
              onClick={() => setSelectedFilter('ACADEMIC')}
              className={`btn btn-sm ${selectedFilter === 'ACADEMIC' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Milestones & Events ({academicCount})
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2.4fr 1.1fr', gap: 24 }}>
            {/* ======================================================== */}
            {/* CALENDAR GRID CARD                                       */}
            {/* ======================================================== */}
            <div className="card">
              <div className="card-header" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <CalendarIcon size={20} color="var(--brand-primary)" />
                  <h2 className="card-title">
                    {monthNames[month]} {year}
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={prevMonth} className="btn btn-secondary btn-sm" aria-label="Previous Month">
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date(2026, 9, 1))}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '12px' }}
                  >
                    October 2026
                  </button>
                  <button onClick={nextMonth} className="btn btn-secondary btn-sm" aria-label="Next Month">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Day Headers */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 6,
                  marginBottom: 8,
                  textAlign: 'center',
                }}
              >
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                  <div key={i} style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-subtle)', padding: '6px' }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Day Cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                {/* Empty offset days */}
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} style={{ height: 90, backgroundColor: 'transparent' }} />
                ))}

                {/* Month Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dayEvents = currentMonthEvents.filter((e) => e.day === dayNum);
                  const isToday = dayNum === 9 && month === 9 && year === 2026;

                  return (
                    <div
                      key={dayNum}
                      style={{
                        minHeight: 90,
                        padding: '6px 8px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isToday ? 'var(--brand-primary-light)' : 'var(--bg-surface-subtle)',
                        border: isToday ? '2px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        gap: 4,
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: isToday ? 'var(--brand-primary)' : 'var(--text-main)',
                          }}
                        >
                          {dayNum}
                        </span>
                        {isToday && (
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              color: 'var(--brand-primary)',
                              textTransform: 'uppercase',
                            }}
                          >
                            Today
                          </span>
                        )}
                      </div>

                      {/* Render events inside cell */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, overflow: 'hidden' }}>
                        {dayEvents.map((evt, eIdx) => (
                          <div
                            key={eIdx}
                            title={`${evt.title} ${evt.subtitle ? `- ${evt.subtitle}` : ''}`}
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 5px',
                              borderRadius: 4,
                              backgroundColor: evt.color || '#3b82f6',
                              color: '#ffffff',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              boxShadow: 'var(--shadow-sm)',
                            }}
                          >
                            {evt.type === 'STAFF_LEAVE' ? `🔴 ${evt.title}` : evt.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ======================================================== */}
            {/* UPCOMING AGENDA LIST                                     */}
            {/* ======================================================== */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Scheduled Milestones</h2>
                <span className="badge badge-info">{currentMonthEvents.length} Items</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '600px', overflowY: 'auto' }}>
                {loadingEvents ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    Loading events...
                  </div>
                ) : currentMonthEvents.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No events scheduled for {monthNames[month]}.
                  </div>
                ) : (
                  currentMonthEvents.map((evt, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px',
                        backgroundColor:
                          evt.type === 'STAFF_LEAVE'
                            ? '#fef2f2'
                            : evt.type === 'HOLIDAY'
                            ? 'rgba(16, 185, 129, 0.08)'
                            : evt.type === 'EXAM'
                            ? 'rgba(139, 92, 246, 0.08)'
                            : 'var(--bg-surface-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        border:
                          evt.type === 'STAFF_LEAVE'
                            ? '1px solid #fee2e2'
                            : evt.type === 'HOLIDAY'
                            ? '1px solid rgba(16, 185, 129, 0.25)'
                            : evt.type === 'EXAM'
                            ? '1px solid rgba(139, 92, 246, 0.25)'
                            : '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: evt.color,
                          marginTop: 4,
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: 'var(--text-main)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 6,
                          }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {evt.title}
                          </span>
                          <span
                            className={`badge ${
                              evt.type === 'STAFF_LEAVE'
                                ? 'badge-danger'
                                : evt.type === 'EXAM'
                                ? 'badge-info'
                                : evt.type === 'HOLIDAY'
                                ? 'badge-success'
                                : evt.type === 'EVENT'
                                ? 'badge-warning'
                                : 'badge-neutral'
                            }`}
                            style={{ fontSize: '9px', padding: '1px 6px', whiteSpace: 'nowrap' }}
                          >
                            {evt.type === 'STAFF_LEAVE'
                              ? 'Faculty Leave'
                              : evt.type === 'EXAM'
                              ? 'Examination'
                              : evt.type === 'HOLIDAY'
                              ? 'Campus Holiday'
                              : evt.type === 'EVENT'
                              ? 'Campus Fest'
                              : evt.type === 'MEETING'
                              ? 'PTM Conference'
                              : 'Academic Milestone'}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 3 }}>
                          {monthNames[month]} {evt.day}, {year}
                          {evt.reason && ` • Reason: ${evt.reason}`}
                          {evt.subtitle && ` • ${evt.subtitle}`}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} isSuperAdmin={user?.isSuperAdmin} />
    </div>
  );
}
