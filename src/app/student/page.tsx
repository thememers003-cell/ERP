'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import CommandPalette from '@/components/CommandPalette';
import MetricCard from '@/components/MetricCard';
import {
  GraduationCap,
  CalendarCheck,
  FileText,
  Award,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  BookOpen,
  User,
  Calendar,
  Sparkles,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronDown,
  Layers,
  Flame,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { AuthUser } from '@/types';

export default function StudentPortalPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const [studentData, setStudentData] = useState<any>(null);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Real-Time Timetable State
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [weeklySlots, setWeeklySlots] = useState<any[]>([]);
  const [currentDay, setCurrentDay] = useState<string>('TODAY');
  const [studentClassInfo, setStudentClassInfo] = useState<any>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  const loadData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      const roles = meData.data?.roles || [];
      const isStudent = roles.includes('STUDENT') || roles.includes('PARENT');
      if (!isStudent) {
        const isFaculty = roles.some((r: string) =>
          ['TEACHER', 'SUBJECT_TEACHER', 'JUNIOR_MATH_TEACHER', 'HOD', 'FACULTY'].includes(r)
        );
        if (isFaculty) {
          router.replace('/faculty');
          return;
        } else if (meData.data?.isSuperAdmin) {
          router.replace('/super-admin');
          return;
        } else {
          router.replace('/admin');
          return;
        }
      }
      setUser(meData.data);

      const [hwRes, exRes, annRes, timeRes, attRes] = await Promise.all([
        fetch('/api/homework'),
        fetch('/api/exams'),
        fetch('/api/announcements?audience=STUDENTS'),
        fetch('/api/academics/timetable'),
        fetch('/api/attendance'),
      ]);

      if (hwRes.ok) setHomeworks((await hwRes.json()).data);
      if (exRes.ok) setExams((await exRes.json()).data);
      if (annRes.ok) setAnnouncements((await annRes.json()).data);

      let contextInfo: any = null;
      if (timeRes.ok) {
        const tData = await timeRes.json();
        if (tData.success && tData.data) {
          setTodaySchedule(tData.data.todaySlots || []);
          setWeeklySlots(tData.data.slots || []);
          setCurrentDay(tData.data.currentDay || 'TODAY');
          contextInfo = tData.data.studentContext || null;
          setStudentClassInfo(contextInfo);
          setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      }

      let attStats = { percentage: 100, present: 0, absent: 0 };
      if (attRes && attRes.ok) {
        const attData = await attRes.json();
        if (attData.success && attData.data?.stats) {
          attStats = {
            percentage: attData.data.stats.percentage,
            present: attData.data.stats.present,
            absent: attData.data.stats.absent,
          };
        }
      }

      // Populate live student summary details
      setStudentData({
        className: contextInfo ? `${contextInfo.className} - ${contextInfo.sectionName}` : 'Grade 8-A',
        admissionNumber: contextInfo?.admissionNumber || 'ADM-2026',
        rollNumber: contextInfo?.rollNumber || '-',
        attendancePercentage: attStats.percentage,
        daysPresent: attStats.present,
        daysAbsent: attStats.absent,
        feeStatus: 'ACTIVE',
      });
    } catch (err) {
      console.error(err);
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
            setTodaySchedule(d.data.todaySlots || []);
            setWeeklySlots(d.data.slots || []);
            setCurrentDay(d.data.currentDay || 'TODAY');
            setStudentClassInfo(d.data.studentContext || null);
            setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
        })
        .catch((err) => console.error('Student timetable sync failed:', err));
    }, 15000);

    return () => clearInterval(syncInterval);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Sample data for the visualizer bar chart matching reference UI
  const chartBars = [
    { label: 'JUN', height: 45, color: '#0284c7' },
    { label: 'JUL', height: 30, color: '#0284c7' },
    { label: 'AUG', height: 60, color: '#0284c7' },
    { label: 'SEP', height: 35, color: '#0284c7' },
    { label: 'OCT', height: 50, color: '#0284c7' },
    { label: 'NOV', height: 85, color: '#f59e0b', highlight: true }, // Highlighted bar
    { label: 'DEC', height: 65, color: '#0284c7' },
    { label: 'JAN', height: 25, color: '#0284c7' },
    { label: 'FEB', height: 55, color: '#0284c7' },
    { label: 'MAR', height: 40, color: '#0284c7' },
  ];

  return (
    <div className="app-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="main-content">
        <Topbar
          user={user}
          onOpenCommand={() => setIsCommandOpen(true)}
          title="Student Dashboard"
          subtitle="Academic Overview & Performance"
        />

        <div className="page-body animate-slide-up">
          {/* ======================================================== */}
          {/* TOP BENTO NAVIGATION GRID (EXACT REFERENCE SCREENSHOT)    */}
          {/* ======================================================== */}
          <div className="luxury-bento-grid">
            <Link href="/student" className="luxury-bento-tile tile-navy">
              <div className="tile-icon">
                <User size={22} color="#fff" />
              </div>
              <div>
                <div className="tile-title">Overview</div>
                <div className="tile-subtitle">My Profile</div>
              </div>
            </Link>

            <Link href="/homework" className="luxury-bento-tile tile-purple">
              <div className="tile-icon">
                <FileText size={22} color="#fff" />
              </div>
              <div>
                <div className="tile-title">Homework</div>
                <div className="tile-subtitle">Assignments & Tasks</div>
              </div>
            </Link>

            <Link href="/student/attendance" className="luxury-bento-tile tile-coral">
              <div className="tile-icon">
                <CalendarCheck size={22} color="#fff" />
              </div>
              <div>
                <div className="tile-title">Attendance</div>
                <div className="tile-subtitle">My Record & Streak</div>
              </div>
            </Link>

            <Link href="/exams" className="luxury-bento-tile tile-cyan">
              <div className="tile-icon">
                <Award size={22} color="#fff" />
              </div>
              <div>
                <div className="tile-title">Gradebook</div>
                <div className="tile-subtitle">Exams & Report Cards</div>
              </div>
            </Link>

            <Link href="/fees" className="luxury-bento-tile tile-teal">
              <div className="tile-icon">
                <CreditCard size={22} color="#fff" />
              </div>
              <div>
                <div className="tile-title">Finances</div>
                <div className="tile-subtitle">Tuition & Invoices</div>
              </div>
            </Link>

            <Link href="/calendar" className="luxury-bento-tile tile-amber">
              <div className="tile-icon">
                <Calendar size={22} color="#fff" />
              </div>
              <div>
                <div className="tile-title">Calendar</div>
                <div className="tile-subtitle">Classes & Events</div>
              </div>
            </Link>

            <Link href="/student/timetable" className="luxury-bento-tile tile-indigo">
              <div className="tile-icon">
                <Clock size={22} color="#fff" />
              </div>
              <div>
                <div className="tile-title">Timetable</div>
                <div className="tile-subtitle">Daily Periods & Bells</div>
              </div>
            </Link>
          </div>

          {/* Class & Class Teacher Info Banner */}
          {studentClassInfo && (
            <div
              className="card"
              style={{
                marginBottom: '24px',
                padding: '16px 20px',
                background: 'linear-gradient(135deg, var(--bg-surface) 60%, rgba(37, 99, 235, 0.06))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    backgroundColor: 'rgba(37, 99, 235, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand-primary)',
                  }}
                >
                  <GraduationCap size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                    {studentClassInfo.className} • {studentClassInfo.sectionName}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    Room: {studentClassInfo.roomNumber || 'Room 101'} • Academic Session 2026-2027
                  </div>
                </div>
              </div>

              {studentClassInfo.classTeacherName && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 14px',
                    borderRadius: 8,
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    fontSize: '13px',
                  }}
                >
                  <UserCheck size={18} color="#059669" />
                  <div>
                    <span style={{ fontSize: '11px', color: '#059669', display: 'block', fontWeight: 700 }}>
                      CLASS TEACHER
                    </span>
                    <strong style={{ color: 'var(--text-main)' }}>{studentClassInfo.classTeacherName}</strong>
                    {studentClassInfo.classTeacherEmail && (
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginLeft: 6 }}>
                        ({studentClassInfo.classTeacherEmail})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section Title: Performance Projection */}
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Performance & Attendance Projection
            </h2>
          </div>

          {/* 3 Metric Cards with Red/Green Trend Badges matching Reference UI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginBottom: '28px' }}>
            {/* Card 1: Overall Attendance */}
            <div className="luxury-metric-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fee2e2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ef4444',
                    fontWeight: 700,
                  }}
                >
                  <CalendarCheck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Attendance Rate</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>96.0% Overall Attendance</div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>48 Academic Days Present</span>
                <span className="trend-pill-green">
                  <TrendingUp size={12} /> +14.2% target
                </span>
              </div>
            </div>

            {/* Card 2: Homework & Assignments */}
            <div className="luxury-metric-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fee2e2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ef4444',
                    fontWeight: 700,
                  }}
                >
                  <FileText size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Pending Homework</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>{homeworks.length} Active Tasks</div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Due by October 11</span>
                <span className="trend-pill-red">
                  <TrendingDown size={12} /> 85.3% submission rate
                </span>
              </div>
            </div>

            {/* Card 3: Gradebook & Performance */}
            <div className="luxury-metric-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #e0f2fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0284c7',
                    fontWeight: 700,
                  }}
                >
                  <Award size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Overall Exam Average</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>94 / 100 (Grade A*)</div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Top 5% in Class 8-A</span>
                <span className="trend-pill-green">
                  <Sparkles size={12} /> Excellent
                </span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* LIVE DAILY TIMETABLE SECTION                             */}
          {/* ======================================================== */}
          <div className="card" style={{ marginBottom: '28px', padding: '22px' }}>
            <div className="card-header" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '10px',
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0284c7',
                  }}
                >
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="card-title">
                    Today's Live Class Timetable ({currentDay})
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
                    <span>Class: <strong>{studentClassInfo?.className || studentData?.className} - {studentClassInfo?.sectionName || 'Section A'}</strong></span>
                    <span>•</span>
                    <span>Room: <strong>{studentClassInfo?.roomNumber || 'Room 201'}</strong></span>
                    {lastSyncTime && (
                      <>
                        <span>•</span>
                        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                          Live synced ({lastSyncTime})
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="badge badge-info">{todaySchedule.length} Periods Scheduled</span>
                <Link href="/student/timetable" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                  <span>Full Week Grid</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {todaySchedule.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                <Calendar size={28} color="var(--text-subtle)" style={{ margin: '0 auto 8px', opacity: 0.7 }} />
                <div style={{ fontWeight: 600 }}>No scheduled classes for {currentDay}.</div>
                <div style={{ fontSize: '12px', marginTop: 4 }}>Check your full weekly timetable for upcoming lessons.</div>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                  gap: '14px',
                }}
              >
                {todaySchedule.map((slot, idx) => (
                  <div
                    key={slot.id || idx}
                    style={{
                      padding: '14px 16px',
                      backgroundColor: slot.status === 'IN_PROGRESS' ? 'rgba(56, 189, 248, 0.08)' : 'var(--bg-surface-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      border: slot.status === 'IN_PROGRESS' ? '1.5px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                      boxShadow: slot.status === 'IN_PROGRESS' ? '0 0 14px rgba(2, 132, 199, 0.2)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            backgroundColor: slot.status === 'IN_PROGRESS' ? 'var(--brand-primary)' : 'var(--bg-surface)',
                            color: slot.status === 'IN_PROGRESS' ? '#fff' : 'var(--text-muted)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          Period {slot.periodNumber}
                        </span>

                        <span
                          className={`badge ${
                            slot.status === 'COMPLETED'
                              ? 'badge-success'
                              : slot.status === 'IN_PROGRESS'
                              ? 'badge-warning'
                              : 'badge-neutral'
                          }`}
                          style={{ fontSize: '10px' }}
                        >
                          {slot.status === 'IN_PROGRESS' ? '⚡ LIVE NOW' : slot.status}
                        </span>
                      </div>

                      <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-main)', marginBottom: 4 }}>
                        {slot.subjectName}
                      </div>

                      <div style={{ fontSize: '12.5px', color: 'var(--brand-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <User size={13} />
                        <span>{slot.teacherName}</span>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 14,
                        paddingTop: 10,
                        borderTop: '1px dashed var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11.5px',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>⏰ {slot.startTime} – {slot.endTime}</span>
                      <span>🏛️ {slot.roomNumber || 'Room 201'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* ANALYTICS BAR CHART & ELECTRONIC AUDITOR LEDGER          */}
          {/* ======================================================== */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '24px', marginBottom: '28px' }}>
            {/* Left: Bar Chart Visualizer ("Attendance Trend by Period") */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>Attendance Trend by Period</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 10px',
                        backgroundColor: 'var(--bg-surface-subtle)',
                        borderRadius: '9999px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span>Monthly</span>
                      <ChevronDown size={12} />
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
                    96.4% <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700 }}>+4.8% ↗</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>vs previous term</div>
                </div>
              </div>

              {/* Bar Chart Visualization */}
              <div
                style={{
                  height: '190px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  paddingTop: '20px',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                {chartBars.map((bar, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      flex: 1,
                    }}
                  >
                    <div
                      className="luxury-chart-bar"
                      style={{
                        height: `${bar.height}%`,
                        width: '18px',
                        backgroundColor: bar.color,
                        boxShadow: bar.highlight ? '0 0 16px rgba(245, 158, 11, 0.4)' : 'none',
                      }}
                      title={`${bar.label}: ${bar.height}%`}
                    />
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-subtle)' }}>
                      {bar.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Electronic Auditor / Live Activity Ledger */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>Electronic Auditor</h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
                    Real-time student account audit logs
                  </div>
                </div>
                <Layers size={18} color="var(--brand-primary)" />
              </div>

              {/* Luxury Timeline */}
              <div className="luxury-timeline">
                <div className="luxury-timeline-item">
                  <div className="luxury-timeline-dot dot-purple" />
                  <div className="luxury-timeline-content">
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#8b5cf6' }}>Today, 09:15</div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', marginTop: 2 }}>
                      Attendance Recorded (Class 8-A)
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: 2 }}>
                      Marked on time by Dr. Rajesh Sharma.
                    </div>
                  </div>
                </div>

                <div className="luxury-timeline-item">
                  <div className="luxury-timeline-dot dot-cyan" />
                  <div className="luxury-timeline-content">
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#0ea5e9' }}>Oct 07, 14:30</div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', marginTop: 2 }}>
                      Math Assignment Posted
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: 2 }}>
                      Exercises 3.1 to 3.4 on Linear Equations (Due: Oct 11).
                    </div>
                  </div>
                </div>

                <div className="luxury-timeline-item">
                  <div className="luxury-timeline-dot dot-emerald" />
                  <div className="luxury-timeline-content">
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981' }}>Oct 02, 11:20</div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', marginTop: 2 }}>
                      Term 2 Tuition Cleared
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: 2 }}>
                      Official voucher #REC-2026-0419 issued successfully ($450.00).
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* HOMEWORK & ANNOUNCEMENTS SECTION                         */}
          {/* ======================================================== */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
            {/* Homework List */}
            <div className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={18} color="var(--brand-primary)" />
                  <h3 className="card-title">My Homework & Assignments</h3>
                </div>
                <Link href="/homework" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                  <span>View All</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {homeworks.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No pending homework right now. Great job!
                  </div>
                ) : (
                  homeworks.map((hw) => (
                    <div
                      key={hw.id}
                      style={{
                        padding: '14px 16px',
                        backgroundColor: 'var(--bg-surface-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span className="badge badge-info">{hw.subjectName}</span>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-subtle)' }}>
                          Due: {new Date(hw.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                        {hw.title}
                      </h4>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: 4 }}>
                        {hw.description}
                      </p>
                      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-subtle)' }}>
                        <span>Teacher: {hw.teacherName}</span>
                        <span>Max Score: {hw.maxMarks} pts</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* School Bulletins & Announcements */}
            <div className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Megaphone size={18} color="var(--brand-accent)" />
                  <h3 className="card-title">Announcements & Bulletins</h3>
                </div>
                <span className="badge badge-neutral">Notice Board</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {announcements.length === 0 ? (
                  <div
                    style={{
                      padding: '14px 16px',
                      backgroundColor: 'var(--bg-surface-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--brand-primary)' }}>
                      Annual Science & Robotics Exhibition
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>
                      Registrations for robotics demonstrations and scientific projects are open at the main library.
                    </p>
                    <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: 8 }}>
                      Organized by STEM & Science Department
                    </div>
                  </div>
                ) : (
                  announcements.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        padding: '14px 16px',
                        backgroundColor: 'var(--bg-surface-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-main)' }}>
                          {a.title}
                        </span>
                        <span className="badge badge-info">{a.category}</span>
                      </div>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: 6 }}>
                        {a.content}
                      </p>
                      <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: 8 }}>
                        Posted by {a.postedByName}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
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
