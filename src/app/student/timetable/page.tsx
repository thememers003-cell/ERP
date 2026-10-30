'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import CommandPalette from '@/components/CommandPalette';
import {
  Clock,
  Calendar,
  GraduationCap,
  User,
  BookOpen,
  Printer,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { AuthUser } from '@/types';

const DAYS_OF_WEEK = [
  { key: 'MONDAY', label: 'Monday' },
  { key: 'TUESDAY', label: 'Tuesday' },
  { key: 'WEDNESDAY', label: 'Wednesday' },
  { key: 'THURSDAY', label: 'Thursday' },
  { key: 'FRIDAY', label: 'Friday' },
  { key: 'SATURDAY', label: 'Saturday' },
];

const DEFAULT_PERIODS = [
  { period: 1, label: 'Period 1', start: '08:30 AM', end: '09:15 AM' },
  { period: 2, label: 'Period 2', start: '09:15 AM', end: '10:00 AM' },
  { period: 3, label: 'Period 3', start: '10:00 AM', end: '10:45 AM' },
  { isBreak: true, label: 'Recess Break', start: '10:45 AM', end: '11:00 AM' },
  { period: 4, label: 'Period 4', start: '11:00 AM', end: '11:45 AM' },
  { period: 5, label: 'Period 5', start: '11:45 AM', end: '12:30 PM' },
  { isBreak: true, label: 'Lunch Break', start: '12:30 PM', end: '01:15 PM' },
  { period: 6, label: 'Period 6', start: '01:15 PM', end: '02:00 PM' },
  { period: 7, label: 'Period 7', start: '02:00 PM', end: '02:45 PM' },
  { period: 8, label: 'Period 8', start: '02:45 PM', end: '03:30 PM' },
];

export default function StudentTimetablePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const [slots, setSlots] = useState<any[]>([]);
  const [todaySlots, setTodaySlots] = useState<any[]>([]);
  const [currentDay, setCurrentDay] = useState<string>('TODAY');
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('ALL');

  const loadData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      setUser(meData.data);

      const timeRes = await fetch('/api/academics/timetable');
      if (timeRes.ok) {
        const tData = await timeRes.json();
        if (tData.success && tData.data) {
          setSlots(tData.data.slots || []);
          setTodaySlots(tData.data.todaySlots || []);
          setCurrentDay(tData.data.currentDay || 'TODAY');
          setStudentInfo(tData.data.studentContext || null);
          setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      }
    } catch (err) {
      console.error('Failed to load student timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Auto-sync real-time timetable updates every 15s
    const syncInterval = setInterval(() => {
      fetch('/api/academics/timetable')
        .then((res) => res.json())
        .then((d) => {
          if (d.success && d.data) {
            setSlots(d.data.slots || []);
            setTodaySlots(d.data.todaySlots || []);
            setCurrentDay(d.data.currentDay || 'TODAY');
            setStudentInfo(d.data.studentContext || null);
            setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          }
        })
        .catch((err) => console.error(err));
    }, 15000);

    return () => clearInterval(syncInterval);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const displayedDays =
    selectedDayFilter === 'ALL'
      ? DAYS_OF_WEEK
      : DAYS_OF_WEEK.filter((d) => d.key === selectedDayFilter);

  return (
    <div className="app-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="main-content">
        <Topbar
          user={user}
          onOpenCommand={() => setIsCommandOpen(true)}
          title="Weekly Class Timetable"
          subtitle={
            studentInfo
              ? `${studentInfo.className} • ${studentInfo.sectionName} (Classroom ${studentInfo.roomNumber || 'Room 201'})`
              : 'My Enrolled Class Schedule'
          }
        />

        <div className="page-body">
          {/* Header Action Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
              flexWrap: 'wrap',
              gap: 14,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {studentInfo ? `${studentInfo.className} - ${studentInfo.sectionName}` : 'My Class'} Schedule
                </h1>
                <span className="badge badge-info" style={{ fontSize: '12px' }}>
                  🏛️ {studentInfo?.roomNumber || 'Room 201'}
                </span>
                {lastSyncTime && (
                  <span
                    style={{
                      fontSize: '11.5px',
                      color: '#10b981',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      fontWeight: 600,
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      padding: '3px 8px',
                      borderRadius: '9999px',
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                    Live Synced ({lastSyncTime})
                  </span>
                )}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: 4 }}>
                Real-time weekly period allocations, assigned subject faculty, and timings.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Day filter selector */}
              <div style={{ display: 'flex', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', padding: 3 }}>
                <button
                  onClick={() => setSelectedDayFilter('ALL')}
                  style={{
                    border: 'none',
                    background: selectedDayFilter === 'ALL' ? 'var(--brand-primary)' : 'transparent',
                    color: selectedDayFilter === 'ALL' ? '#fff' : 'var(--text-muted)',
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                  }}
                >
                  Full Week
                </button>
                {DAYS_OF_WEEK.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setSelectedDayFilter(d.key)}
                    style={{
                      border: 'none',
                      background: selectedDayFilter === d.key ? 'var(--brand-primary)' : 'transparent',
                      color: selectedDayFilter === d.key ? '#fff' : 'var(--text-muted)',
                      padding: '5px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                    }}
                  >
                    {d.label.slice(0, 3)}
                  </button>
                ))}
              </div>

              <button
                onClick={() => window.print()}
                className="btn btn-secondary"
                title="Print your class timetable"
              >
                <Printer size={15} />
                <span>Print Schedule</span>
              </button>
            </div>
          </div>

          {/* Timetable Interactive Grid Card */}
          <div
            className="card"
            style={{
              padding: '16px',
              overflowX: 'auto',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {slots.length === 0 && !loading ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Calendar size={36} color="var(--text-subtle)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                  No Timetable Slots Published Yet
                </h3>
                <p style={{ fontSize: '13px', marginTop: 4 }}>
                  Your school administration has not published weekly timetable periods for this class section yet.
                </p>
              </div>
            ) : (
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: '8px',
                  minWidth: selectedDayFilter === 'ALL' ? '980px' : '400px',
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        width: '120px',
                        textAlign: 'center',
                        padding: '10px',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--text-muted)',
                        backgroundColor: 'var(--bg-surface-subtle)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      Period
                    </th>
                    {displayedDays.map((day) => {
                      const isToday = day.key === currentDay;
                      return (
                        <th
                          key={day.key}
                          style={{
                            textAlign: 'center',
                            padding: '12px 14px',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: isToday ? 'var(--brand-primary)' : 'var(--text-primary)',
                            backgroundColor: isToday ? 'rgba(56, 189, 248, 0.1)' : 'var(--bg-surface-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            borderBottom: isToday ? '3px solid var(--brand-primary)' : '2px solid transparent',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <span>{day.label}</span>
                            {isToday && (
                              <span className="badge badge-info" style={{ fontSize: '10px', padding: '1px 5px' }}>
                                TODAY
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {DEFAULT_PERIODS.map((periodRow, pIdx) => {
                    if (periodRow.isBreak) {
                      return (
                        <tr key={`break-${pIdx}`}>
                          <td
                            colSpan={displayedDays.length + 1}
                            style={{
                              textAlign: 'center',
                              padding: '8px',
                              backgroundColor: 'rgba(245, 158, 11, 0.08)',
                              border: '1px dashed rgba(245, 158, 11, 0.3)',
                              borderRadius: 'var(--radius-sm)',
                              color: '#d97706',
                              fontSize: '12px',
                              fontWeight: 700,
                              letterSpacing: '0.06em',
                            }}
                          >
                            ☕ {periodRow.label.toUpperCase()} ({periodRow.start} – {periodRow.end})
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={`p-${periodRow.period}`}>
                        {/* Period Column */}
                        <td
                          style={{
                            backgroundColor: 'var(--bg-surface-subtle)',
                            padding: '10px 8px',
                            borderRadius: 'var(--radius-sm)',
                            textAlign: 'center',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: '13px' }}>{periodRow.label}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
                            {periodRow.start}
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-subtle)' }}>
                            to {periodRow.end}
                          </div>
                        </td>

                        {/* Days Cells */}
                        {displayedDays.map((day) => {
                          const slot = slots.find(
                            (s) => s.dayOfWeek === day.key && s.periodNumber === periodRow.period
                          );

                          const isToday = day.key === currentDay;

                          return (
                            <td
                              key={`${day.key}-${periodRow.period}`}
                              style={{
                                verticalAlign: 'top',
                                minHeight: 110,
                                height: '100%',
                              }}
                            >
                              {slot ? (
                                <div
                                  style={{
                                    backgroundColor: 'var(--bg-surface)',
                                    border: isToday
                                      ? '1px solid var(--brand-primary)'
                                      : '1px solid var(--border-subtle)',
                                    borderLeft: '4px solid var(--brand-primary)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '12px 14px',
                                    minHeight: '105px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    boxShadow: isToday ? '0 4px 12px rgba(2, 132, 199, 0.1)' : 'var(--shadow-sm)',
                                    transition: 'all 0.2s ease',
                                  }}
                                >
                                  <div>
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        justifyContent: 'space-between',
                                        gap: 6,
                                        marginBottom: 6,
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontWeight: 800,
                                          fontSize: '13.5px',
                                          lineHeight: 1.25,
                                          color: 'var(--text-primary)',
                                        }}
                                      >
                                        {slot.subjectName}
                                      </span>
                                      <span
                                        className="command-kbd"
                                        style={{ fontSize: '10px', padding: '1px 5px' }}
                                      >
                                        {slot.subjectCode}
                                      </span>
                                    </div>

                                    {/* Faculty / Teacher Name */}
                                    <div
                                      style={{
                                        fontSize: '12px',
                                        color: 'var(--brand-primary)',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 5,
                                        marginTop: 4,
                                      }}
                                    >
                                      <User size={13} />
                                      <span>{slot.teacherName}</span>
                                    </div>
                                  </div>

                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      marginTop: 10,
                                      paddingTop: 6,
                                      borderTop: '1px dashed var(--border-subtle)',
                                      fontSize: '11px',
                                      color: 'var(--text-muted)',
                                    }}
                                  >
                                    <span style={{ fontWeight: 500 }}>
                                      ⏰ {slot.startTime} – {slot.endTime}
                                    </span>
                                    <span
                                      style={{
                                        backgroundColor: 'var(--bg-surface-subtle)',
                                        padding: '2px 6px',
                                        borderRadius: 3,
                                        color: 'var(--text-subtle)',
                                      }}
                                    >
                                      🏛️ {slot.roomNumber || 'Room 201'}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    minHeight: '105px',
                                    border: '1px dashed var(--border-subtle)',
                                    borderRadius: 'var(--radius-sm)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--text-subtle)',
                                    fontSize: '11.5px',
                                  }}
                                >
                                  <span>Free / Recess</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
      />
    </div>
  );
}
