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
  Clock,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Megaphone,
  BookOpen,
  ArrowRight,
  Bell,
  Users,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  TrendingDown,
  User,
} from 'lucide-react';
import { AuthUser } from '@/types';

export default function FacultyDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Faculty Personal Tasks State
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');

  // Announcements State
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Real-Time Timetable Schedule State
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [weeklySlots, setWeeklySlots] = useState<any[]>([]);
  const [currentDay, setCurrentDay] = useState<string>('TODAY');
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
      if (isStudent) {
        router.replace('/student');
        return;
      }
      const isFaculty = roles.some((r: string) =>
        ['TEACHER', 'SUBJECT_TEACHER', 'JUNIOR_MATH_TEACHER', 'HOD', 'FACULTY'].includes(r)
      );
      if (!isFaculty && !meData.data?.isSuperAdmin) {
        router.replace('/admin');
        return;
      }
      setUser(meData.data);

      // Fetch personal tasks, school announcements, and live faculty timetable
      const [taskRes, annRes, timeRes] = await Promise.all([
        fetch('/api/faculty/tasks'),
        fetch('/api/announcements?audience=TEACHERS'),
        fetch('/api/academics/timetable'),
      ]);

      if (taskRes.ok) setTasks((await taskRes.json()).data);
      if (annRes.ok) setAnnouncements((await annRes.json()).data);
      if (timeRes.ok) {
        const tData = await timeRes.json();
        if (tData.success && tData.data) {
          setTodaySchedule(tData.data.todaySlots || []);
          setWeeklySlots(tData.data.slots || []);
          setCurrentDay(tData.data.currentDay || 'TODAY');
          setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Real-Time Synchronization Interval: sync every 15s
    const syncInterval = setInterval(() => {
      fetch('/api/academics/timetable')
        .then((res) => res.json())
        .then((d) => {
          if (d.success && d.data) {
            setTodaySchedule(d.data.todaySlots || []);
            setWeeklySlots(d.data.slots || []);
            setCurrentDay(d.data.currentDay || 'TODAY');
            setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
        })
        .catch((err) => console.error('Timetable sync failed:', err));
    }, 15000);

    return () => clearInterval(syncInterval);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch('/api/faculty/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle, priority: newTaskPriority }),
      });

      if (res.ok) {
        setNewTaskTitle('');
        const taskData = await res.json();
        setTasks((prev) => [taskData.data, ...prev]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/faculty/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, isCompleted: !currentStatus }),
      });

      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, isCompleted: !currentStatus } : t))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/faculty/tasks?id=${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="app-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="main-content">
        <Topbar
          user={user}
          onOpenCommand={() => setIsCommandOpen(true)}
          title="Faculty Workstation"
          subtitle="Class Schedule & Daily Tasks"
        />

        <div className="page-body animate-slide-up">
          {/* ======================================================== */}
          {/* TOP BENTO NAVIGATION GRID (REFERENCE SCREENSHOT UI)       */}
          {/* ======================================================== */}
          <div className="luxury-bento-grid">
            <Link href="/faculty" className="luxury-bento-tile tile-navy">
              <div className="tile-icon">
                <GraduationCap size={22} color="#fff" />
              </div>
              <div>
                <div className="tile-title">Overview</div>
                <div className="tile-subtitle">Faculty Desk</div>
              </div>
            </Link>

            <Link href="/attendance" className="luxury-bento-tile tile-coral">
              <div className="tile-icon">
                <CalendarCheck size={22} color="#fff" />
              </div>
              <div>
                <div className="tile-title">Attendance</div>
                <div className="tile-subtitle">Take Roll Call</div>
              </div>
            </Link>

            <Link href="/homework" className="luxury-bento-tile tile-purple">
              <div className="tile-icon">
                <FileText size={22} color="#fff" />
              </div>
              <div>
                <div className="tile-title">Homework</div>
                <div className="tile-subtitle">Assign Tasks</div>
              </div>
            </Link>

            <Link href="/exams" className="luxury-bento-tile tile-cyan">
              <div className="tile-icon">
                <Award size={22} color="#fff" />
              </div>
              <div>
                <div className="tile-title">Gradebook</div>
                <div className="tile-subtitle">Enter Grades</div>
              </div>
            </Link>

            <Link href="/leaves" className="luxury-bento-tile tile-teal">
              <div className="tile-icon">
                <Clock size={22} color="#fff" />
              </div>
              <div>
                <div className="tile-title">Leaves</div>
                <div className="tile-subtitle">Apply & Quotas</div>
              </div>
            </Link>

            <Link href="/calendar" className="luxury-bento-tile tile-amber">
              <div className="tile-icon">
                <Calendar size={22} color="#fff" />
              </div>
              <div>
                <div className="tile-title">Timetable</div>
                <div className="tile-subtitle">Weekly Schedule</div>
              </div>
            </Link>
          </div>

          {/* Section Header */}
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Workload Management & Today's Schedule
            </h2>
          </div>

          {/* 3 Metric Cards with Red/Green Trend Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginBottom: '28px' }}>
            <div className="luxury-metric-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #dbeafe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563eb',
                    fontWeight: 700,
                  }}
                >
                  <Clock size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Scheduled Classes Today</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>4 Periods (3h45m)</div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Classes 8-A, 8-B & Office Hours</span>
                <span className="trend-pill-green">
                  <TrendingUp size={12} /> 100% On-Time
                </span>
              </div>
            </div>

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
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Daily Attendance</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>1/2 Classes Recorded</div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pending: Class 8-B</span>
                <span className="trend-pill-red">
                  <TrendingDown size={12} /> Mark Attendance
                </span>
              </div>
            </div>

            <div className="luxury-metric-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#16a34a',
                    fontWeight: 700,
                  }}
                >
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>My Daily Tasks</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                    {tasks.filter((t) => t.isCompleted).length} / {tasks.length} Completed
                  </div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Weekly Priorities</span>
                <span className="trend-pill-green">
                  <Sparkles size={12} /> On Schedule
                </span>
              </div>
            </div>
          </div>

          {/* Master 2-Column Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
            {/* Left Column: Today's Timetable Schedule */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="card">
                <div className="card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Clock size={18} color="var(--brand-primary)" />
                    <div>
                      <h3 className="card-title">Today's Class Schedule ({currentDay})</h3>
                      {lastSyncTime && (
                        <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                          <span>Live synced at {lastSyncTime}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge badge-info">{todaySchedule.length} Periods</span>
                    <Link href="/admin/timetable" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                      <span>Full Week</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {todaySchedule.length === 0 ? (
                    <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      <Calendar size={28} color="var(--text-subtle)" style={{ margin: '0 auto 8px', opacity: 0.7 }} />
                      <div style={{ fontWeight: 600 }}>No teaching periods scheduled for {currentDay}.</div>
                      <div style={{ fontSize: '12px', marginTop: 4 }}>
                        You have {weeklySlots.length} periods assigned across the full week.
                      </div>
                      <Link href="/admin/timetable" className="btn btn-secondary btn-sm" style={{ marginTop: 12, display: 'inline-flex', textDecoration: 'none' }}>
                        View Weekly Timetable
                      </Link>
                    </div>
                  ) : (
                    todaySchedule.map((slot, idx) => (
                      <div
                        key={slot.id || idx}
                        style={{
                          padding: '14px 16px',
                          backgroundColor: slot.status === 'IN_PROGRESS' ? 'rgba(56, 189, 248, 0.08)' : 'var(--bg-surface-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          border: slot.status === 'IN_PROGRESS' ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                          borderLeft: slot.status === 'IN_PROGRESS' ? '4px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '10px',
                              backgroundColor: slot.status === 'IN_PROGRESS' ? 'var(--brand-primary)' : 'var(--brand-primary-light)',
                              color: slot.status === 'IN_PROGRESS' ? '#fff' : 'var(--brand-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '13px',
                            }}
                          >
                            P{slot.periodNumber || slot.period}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{slot.subjectName || slot.subject}</span>
                              {slot.subjectCode && <span className="command-kbd" style={{ fontSize: '10px' }}>{slot.subjectCode}</span>}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>
                              {slot.className ? `${slot.className} - ${slot.sectionName}` : slot.class} • 🏛️ {slot.roomNumber || slot.room || 'Room unassigned'}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                            {slot.startTime ? `${slot.startTime} - ${slot.endTime}` : slot.time}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
                            {slot.sectionId && (
                              <Link
                                href={`/attendance?sectionId=${slot.sectionId}&period=${slot.periodNumber || slot.period || 1}`}
                                className="btn btn-primary btn-sm"
                                style={{
                                  fontSize: '11px',
                                  padding: '2px 8px',
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                                title="Take period attendance for this class"
                              >
                                <CalendarCheck size={12} />
                                <span>Take Attendance</span>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* School Announcements for Teachers */}
              <div className="card">
                <div className="card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Megaphone size={18} color="var(--brand-accent)" />
                    <h3 className="card-title">Coordination Bulletins</h3>
                  </div>
                  <span className="badge badge-neutral">Faculty Staff</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {announcements.length === 0 ? (
                    <div style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      No new institutional bulletins today.
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
                          <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-main)' }}>{a.title}</span>
                          <span className="badge badge-info">{a.category}</span>
                        </div>
                        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: 4 }}>{a.content}</p>
                        <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: 8 }}>
                          Posted by {a.postedByName}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Faculty Daily Task Manager & Activity Feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="card">
                <div className="card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CheckCircle2 size={18} color="var(--brand-primary)" />
                    <h3 className="card-title">My Daily Tasks</h3>
                  </div>
                  <span className="badge badge-info">
                    {tasks.filter((t) => !t.isCompleted).length} Pending
                  </span>
                </div>

                {/* Add New Task Form */}
                <form onSubmit={handleAddTask} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Add a task for today..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    style={{ flex: 1, fontSize: '13px' }}
                  />
                  <select
                    className="select"
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    style={{ width: 'auto', fontSize: '12px' }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                  <button type="submit" className="btn btn-primary btn-sm">
                    <Plus size={15} />
                  </button>
                </form>

                {/* Task Checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tasks.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      No tasks yet. Type above to organize your day!
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <div
                        key={task.id}
                        style={{
                          padding: '12px 14px',
                          backgroundColor: task.isCompleted ? 'var(--bg-surface-subtle)' : 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          transition: 'all 0.2s ease',
                          opacity: task.isCompleted ? 0.65 : 1,
                        }}
                      >
                        <div
                          onClick={() => handleToggleTask(task.id, task.isCompleted)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            flex: 1,
                            cursor: 'pointer',
                          }}
                        >
                          {task.isCompleted ? (
                            <CheckCircle2 size={18} color="var(--brand-accent)" />
                          ) : (
                            <Circle size={18} color="var(--text-subtle)" />
                          )}
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: 600,
                              color: 'var(--text-main)',
                              textDecoration: task.isCompleted ? 'line-through' : 'none',
                            }}
                          >
                            {task.title}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            className={`badge ${
                              task.priority === 'HIGH'
                                ? 'badge-danger'
                                : task.priority === 'MEDIUM'
                                ? 'badge-warning'
                                : 'badge-neutral'
                            }`}
                            style={{ fontSize: '10px' }}
                          >
                            {task.priority}
                          </span>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="btn-icon"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-subtle)',
                              cursor: 'pointer',
                              padding: 4,
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Faculty Activity Ledger */}
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>Faculty Activity Ledger</h3>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
                      Recently logged teaching actions
                    </div>
                  </div>
                  <Layers size={17} color="var(--brand-primary)" />
                </div>

                <div className="luxury-timeline">
                  <div className="luxury-timeline-item">
                    <div className="luxury-timeline-dot dot-cyan" />
                    <div className="luxury-timeline-content">
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#0ea5e9' }}>Today, 09:45</div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)' }}>
                        Attendance Recorded (Class 8-A)
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        3 students marked present in official register.
                      </div>
                    </div>
                  </div>

                  <div className="luxury-timeline-item">
                    <div className="luxury-timeline-dot dot-purple" />
                    <div className="luxury-timeline-content">
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#8b5cf6' }}>Yesterday, 16:10</div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)' }}>
                        Homework Assignment Published
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Linear Equations Problem Set (Max 50 pts).
                      </div>
                    </div>
                  </div>
                </div>
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
