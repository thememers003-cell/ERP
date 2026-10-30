'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import CommandPalette from '@/components/CommandPalette';
import Modal from '@/components/Modal';
import StudentSubmissionDrawer from '@/components/StudentSubmissionDrawer';
import TeacherGradingDrawer from '@/components/TeacherGradingDrawer';
import {
  FileText,
  Plus,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  CalendarCheck,
  Award,
  CreditCard,
  User,
  Send,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckSquare,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  PenTool,
  Bookmark,
  Bell,
  Trash2,
  Eye,
} from 'lucide-react';
import { AuthUser } from '@/types';

export default function HomeworkAndDiaryPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Active View Tab: 'DIARY' or 'ASSIGNMENTS'
  const [activeTab, setActiveTab] = useState<'DIARY' | 'ASSIGNMENTS'>('DIARY');

  // Diary Date Navigation
  const [diaryDate, setDiaryDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Assignment filter
  const [hwFilter, setHwFilter] = useState<'ALL' | 'PENDING' | 'SUBMITTED' | 'EVALUATED'>('ALL');

  // Drawers
  const [selectedHwForStudent, setSelectedHwForStudent] = useState<any | null>(null);
  const [selectedHwIdForTeacher, setSelectedHwIdForTeacher] = useState<string | null>(null);

  // Publish Modal
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishType, setPublishType] = useState<'DIARY' | 'HOMEWORK'>('DIARY');
  const [publishing, setPublishing] = useState(false);
  const [formError, setFormError] = useState('');
  const [publishForm, setPublishForm] = useState({
    sectionId: '',
    subjectId: '',
    title: '',
    classwork: '',
    description: '', // for homework or homework tasks
    parentNotice: '',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    maxMarks: 50,
    resourceLinks: '',
  });

  // Parent Signature Modal
  const [signModalHw, setSignModalHw] = useState<any | null>(null);
  const [parentReplyNote, setParentReplyNote] = useState('');
  const [signing, setSigning] = useState(false);

  const isStudent = user?.roles?.includes('STUDENT');
  const isParent = user?.roles?.includes('PARENT');
  const isTeacherOrAdmin = !isStudent && !isParent;

  const loadData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      setUser(meData.data);

      const [hwRes, clsRes, subRes] = await Promise.all([
        fetch('/api/homework'),
        fetch('/api/academics/classes'),
        fetch('/api/academics/subjects'),
      ]);

      if (hwRes.ok) setItems((await hwRes.json()).data);
      if (subRes.ok) setSubjects((await subRes.json()).data);

      if (clsRes.ok) {
        const classes = (await clsRes.json()).data;
        const allSecs: any[] = [];
        classes.forEach((c: any) => {
          c.sections.forEach((s: any) => {
            allSecs.push({ ...s, className: c.name });
          });
        });
        setSections(allSecs);
        if (allSecs.length > 0 && !publishForm.sectionId) {
          setPublishForm((prev) => ({
            ...prev,
            sectionId: allSecs[0].id,
          }));
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
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Publish Form Submit
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishing(true);
    setFormError('');

    try {
      const res = await fetch('/api/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryType: publishType,
          sectionId: publishForm.sectionId || sections[0]?.id,
          subjectId: publishForm.subjectId || subjects[0]?.id,
          title: publishForm.title || (publishType === 'DIARY' ? `Daily Diary Log: ${publishForm.classwork.slice(0, 30)}...` : 'Assignment'),
          classwork: publishForm.classwork,
          description: publishForm.description,
          parentNotice: publishForm.parentNotice,
          dueDate: publishForm.dueDate,
          maxMarks: publishForm.maxMarks,
          resourceLinks: publishForm.resourceLinks ? publishForm.resourceLinks.split(',').map((s) => s.trim()) : [],
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to publish entry');
      }

      setIsPublishModalOpen(false);
      setPublishForm({
        sectionId: sections[0]?.id || '',
        subjectId: subjects[0]?.id || '',
        title: '',
        classwork: '',
        description: '',
        parentNotice: '',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        maxMarks: 50,
        resourceLinks: '',
      });
      loadData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  // Parent Signature Action
  const handleSignDiary = async () => {
    if (!signModalHw) return;
    setSigning(true);
    try {
      const res = await fetch(`/api/homework/${signModalHw.id}/sign-diary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyNote: parentReplyNote }),
      });
      const json = await res.json();
      if (json.success) {
        setSignModalHw(null);
        setParentReplyNote('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSigning(false);
    }
  };

  // Delete Homework Action
  const handleDeleteItem = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const res = await fetch(`/api/homework/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered diary entries for selected date
  const diaryEntries = items.filter((i) => {
    if (i.entryType !== 'DIARY') return false;
    const createdAtDate = new Date(i.createdAt).toISOString().split('T')[0];
    const dueDate = new Date(i.dueDate).toISOString().split('T')[0];
    return createdAtDate === diaryDate || dueDate === diaryDate;
  });

  // Filtered assignments
  const assignments = items.filter((i) => i.entryType === 'HOMEWORK').filter((hw) => {
    if (hwFilter === 'ALL') return true;
    if (hwFilter === 'PENDING') return !hw.mySubmission;
    if (hwFilter === 'SUBMITTED') return hw.mySubmission && hw.mySubmission.status !== 'EVALUATED';
    if (hwFilter === 'EVALUATED') return hw.mySubmission && hw.mySubmission.status === 'EVALUATED';
    return true;
  });

  return (
    <div className="app-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="main-content">
        <Topbar
          user={user}
          onOpenCommand={() => setIsCommandOpen(true)}
          title={isParent ? 'Parent Diary & Student Tasks' : isStudent ? 'School Diary & Assignments' : 'Academic Diary & Assignments Studio'}
          subtitle="Daily learning agenda, teacher notes to parents, and student assignment submissions"
        />

        <div className="page-body animate-slide-up">
          {/* Bento navigation for students/parents */}
          {(isStudent || isParent) && (
            <div className="luxury-bento-grid" style={{ marginBottom: 20 }}>
              <Link href={isParent ? '/student' : '/student'} className="luxury-bento-tile tile-navy">
                <div className="tile-icon"><User size={22} color="#fff" /></div>
                <div><div className="tile-title">Overview</div><div className="tile-subtitle">Student Home</div></div>
              </Link>
              <Link href="/homework" className="luxury-bento-tile tile-purple" style={{ outline: '3px solid #8b5cf6', outlineOffset: '2px' }}>
                <div className="tile-icon"><BookOpen size={22} color="#fff" /></div>
                <div><div className="tile-title">Diary & Tasks</div><div className="tile-subtitle">Daily Work & Signatures</div></div>
              </Link>
              <Link href="/student/attendance" className="luxury-bento-tile tile-coral">
                <div className="tile-icon"><CalendarCheck size={22} color="#fff" /></div>
                <div><div className="tile-title">Attendance</div><div className="tile-subtitle">Streak Tracker</div></div>
              </Link>
              <Link href="/exams" className="luxury-bento-tile tile-cyan">
                <div className="tile-icon"><Award size={22} color="#fff" /></div>
                <div><div className="tile-title">Gradebook</div><div className="tile-subtitle">Exam Scores</div></div>
              </Link>
              <Link href="/fees" className="luxury-bento-tile tile-teal">
                <div className="tile-icon"><CreditCard size={22} color="#fff" /></div>
                <div><div className="tile-title">Finances</div><div className="tile-subtitle">Tuition Status</div></div>
              </Link>
              <Link href="/calendar" className="luxury-bento-tile tile-amber">
                <div className="tile-icon"><Calendar size={22} color="#fff" /></div>
                <div><div className="tile-title">Calendar</div><div className="tile-subtitle">Institutional Schedule</div></div>
              </Link>
            </div>
          )}

          {/* Top Control Bar: Segmented Switcher & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
            {/* View Switcher Pills */}
            <div
              style={{
                display: 'inline-flex',
                backgroundColor: 'var(--bg-surface-elevated)',
                padding: '4px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                gap: 4,
              }}
            >
              <button
                onClick={() => setActiveTab('DIARY')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: activeTab === 'DIARY' ? 700 : 500,
                  backgroundColor: activeTab === 'DIARY' ? 'var(--brand-primary)' : 'transparent',
                  color: activeTab === 'DIARY' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <BookOpen size={15} />
                <span>📖 Daily School Diary (Almanac)</span>
              </button>

              <button
                onClick={() => setActiveTab('ASSIGNMENTS')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: activeTab === 'ASSIGNMENTS' ? 700 : 500,
                  backgroundColor: activeTab === 'ASSIGNMENTS' ? 'var(--brand-primary)' : 'transparent',
                  color: activeTab === 'ASSIGNMENTS' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <FileText size={15} />
                <span>🎯 Assignments & Turn-In Hub</span>
              </button>
            </div>

            {/* Teacher / Admin Action Button */}
            {isTeacherOrAdmin && (
              <button
                onClick={() => {
                  if (subjects.length > 0 && !publishForm.subjectId) {
                    setPublishForm((prev) => ({ ...prev, subjectId: subjects[0].id }));
                  }
                  setIsPublishModalOpen(true);
                }}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={16} />
                <span>Publish Diary Entry / Assignment</span>
              </button>
            )}
          </div>

          {/* ======================================================== */}
          {/* TAB 1: DAILY SCHOOL DIARY (ALMANAC FOR PARENTS & TEACHERS) */}
          {/* ======================================================== */}
          {activeTab === 'DIARY' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Date Navigator Strip */}
              <div
                className="card"
                style={{
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    onClick={() => {
                      const d = new Date(diaryDate);
                      d.setDate(d.getDate() - 1);
                      setDiaryDate(d.toISOString().split('T')[0]);
                    }}
                    className="btn btn-secondary btn-sm"
                    title="Previous Day"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={16} color="var(--brand-primary)" />
                    <input
                      type="date"
                      className="input"
                      style={{ width: 'auto', padding: '4px 10px', fontSize: '13px', fontWeight: 700 }}
                      value={diaryDate}
                      onChange={(e) => setDiaryDate(e.target.value)}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {new Date(diaryDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      const d = new Date(diaryDate);
                      d.setDate(d.getDate() + 1);
                      setDiaryDate(d.toISOString().split('T')[0]);
                    }}
                    className="btn btn-secondary btn-sm"
                    title="Next Day"
                  >
                    <ChevronRight size={16} />
                  </button>

                  <button
                    onClick={() => setDiaryDate(new Date().toISOString().split('T')[0])}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '12px' }}
                  >
                    Today
                  </button>
                </div>

                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Showing <strong>{diaryEntries.length}</strong> subject agenda notes for this date
                </div>
              </div>

              {/* Diary Entries List */}
              {diaryEntries.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {diaryEntries.map((entry) => {
                    return (
                      <div
                        key={entry.id}
                        className="card"
                        style={{
                          padding: '22px 24px',
                          borderLeft: '4px solid var(--brand-primary)',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        {/* Top Bar of the Diary Card */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span className="badge badge-primary" style={{ fontSize: '12px', fontWeight: 700, padding: '3px 8px' }}>
                              {entry.subjectName} ({entry.subjectCode})
                            </span>
                            <span className="badge badge-neutral">
                              {entry.className} - {entry.sectionName}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              Posted by <strong>{entry.teacherName}</strong>
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {/* Parent Signature Status Badge */}
                            {entry.isDiarySigned ? (
                              <span
                                className="badge badge-success"
                                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', fontSize: '12px', fontWeight: 700 }}
                              >
                                <ShieldCheck size={14} />
                                <span>SIGNED & ACKNOWLEDGED</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setSignModalHw(entry);
                                  setParentReplyNote('');
                                }}
                                className="btn btn-primary btn-sm"
                                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', fontSize: '12px' }}
                              >
                                <PenTool size={13} />
                                <span>✍️ Sign as Parent</span>
                              </button>
                            )}

                            {isTeacherOrAdmin && (
                              <button
                                onClick={() => handleDeleteItem(entry.id, entry.title)}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: 6, color: 'var(--status-danger)' }}
                                title="Delete Diary Entry"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', marginBottom: 14 }}>
                          {entry.title}
                        </h3>

                        {/* Dual Classwork & Homework Blocks */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
                          {/* Classwork */}
                          <div
                            style={{
                              backgroundColor: 'var(--bg-surface-subtle)',
                              padding: '14px 16px',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)', marginBottom: 6 }}>
                              <Bookmark size={14} />
                              <span>CLASSWORK COVERED TODAY:</span>
                            </div>
                            <div style={{ fontSize: '13.5px', color: 'var(--text-main)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                              {entry.classwork || entry.description || 'Routine syllabus topics and classroom practice exercises.'}
                            </div>
                          </div>

                          {/* Homework / Home Tasks */}
                          <div
                            style={{
                              backgroundColor: 'rgba(245, 158, 11, 0.05)',
                              padding: '14px 16px',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid rgba(245, 158, 11, 0.25)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', fontWeight: 700, color: '#d97706', marginBottom: 6 }}>
                              <CheckSquare size={14} />
                              <span>HOMEWORK FOR HOME:</span>
                            </div>
                            <div style={{ fontSize: '13.5px', color: 'var(--text-main)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                              {entry.description || 'Review classroom notes and practice remaining workbook questions.'}
                            </div>
                          </div>
                        </div>

                        {/* Urgent Teacher Notice to Parents */}
                        {entry.parentNotice && (
                          <div
                            style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.06)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '10px 14px',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 10,
                              marginBottom: 12,
                            }}
                          >
                            <Bell size={16} color="var(--status-danger)" style={{ marginTop: 2, flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--status-danger)' }}>
                                TEACHER REMARK TO PARENT:
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--text-main)', marginTop: 2 }}>
                                {entry.parentNotice}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Parent Signatures Log Footer */}
                        {entry.parentSignatures && entry.parentSignatures.length > 0 && (
                          <div
                            style={{
                              paddingTop: 10,
                              borderTop: '1px solid var(--border-subtle)',
                              fontSize: '12px',
                              color: 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <ShieldCheck size={14} color="var(--status-success)" />
                              <span>
                                Acknowledged by <strong>{entry.parentSignatures[entry.parentSignatures.length - 1].parentName}</strong> on{' '}
                                {new Date(entry.parentSignatures[entry.parentSignatures.length - 1].signedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {entry.parentSignatures[entry.parentSignatures.length - 1].replyNote && (
                              <span style={{ fontStyle: 'italic', color: 'var(--brand-primary)' }}>
                                Note to Teacher: "{entry.parentSignatures[entry.parentSignatures.length - 1].replyNote}"
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                  <BookOpen size={40} color="var(--text-subtle)" style={{ margin: '0 auto 12px' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                    No Diary Entries Logged for {new Date(diaryDate).toLocaleDateString()}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: 4 }}>
                    {isTeacherOrAdmin
                      ? 'Click the "Publish Diary Entry / Assignment" button above to post today\'s classwork, homework, and parent notes.'
                      : 'The class teachers have not logged daily agenda tasks for this date.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: ASSIGNMENTS & TURN-IN HUB */}
          {/* ======================================================== */}
          {activeTab === 'ASSIGNMENTS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Filter Pills */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { id: 'ALL', label: `All Tasks (${assignments.length})` },
                    { id: 'PENDING', label: 'Pending / Due' },
                    { id: 'SUBMITTED', label: 'Turned In' },
                    { id: 'EVALUATED', label: 'Graded' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setHwFilter(p.id as any)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12.5px',
                        fontWeight: hwFilter === p.id ? 700 : 500,
                        backgroundColor: hwFilter === p.id ? 'var(--brand-primary)' : 'var(--bg-surface)',
                        color: hwFilter === p.id ? '#fff' : 'var(--text-muted)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Total Assignments: <strong>{assignments.length}</strong>
                </div>
              </div>

              {/* Assignment Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                {assignments.map((hw) => {
                  const mySub = hw.mySubmission;
                  const isSubmitted = !!mySub;
                  const isEvaluated = mySub?.status === 'EVALUATED';
                  const isPastDue = new Date() > new Date(hw.dueDate);

                  return (
                    <div
                      key={hw.id}
                      className="card"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '20px',
                        borderTop: isEvaluated
                          ? '3px solid var(--status-success)'
                          : isSubmitted
                          ? '3px solid var(--brand-primary)'
                          : isPastDue
                          ? '3px solid var(--status-danger)'
                          : '3px solid var(--status-warning)',
                      }}
                    >
                      <div>
                        {/* Subject Badge & Status */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span className="badge badge-info" style={{ fontWeight: 700 }}>
                            {hw.subjectName}
                          </span>

                          <span
                            className={`badge ${
                              isEvaluated
                                ? 'badge-success'
                                : isSubmitted
                                ? 'badge-primary'
                                : isPastDue
                                ? 'badge-danger'
                                : 'badge-warning'
                            }`}
                            style={{ fontWeight: 800, fontSize: '11px' }}
                          >
                            {isEvaluated
                              ? `GRADED: ${mySub.marksAwarded}/${hw.maxMarks}`
                              : isSubmitted
                              ? mySub.status === 'LATE' ? 'TURNED IN (LATE)' : 'TURNED IN'
                              : isPastDue
                              ? 'MISSING / PAST DUE'
                              : 'ASSIGNED'}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 style={{ fontSize: '16.5px', fontWeight: 800, color: 'var(--text-main)', marginBottom: 6 }}>
                          {hw.title}
                        </h3>

                        {/* Description Preview */}
                        <p
                          style={{
                            fontSize: '13px',
                            color: 'var(--text-muted)',
                            lineHeight: 1.5,
                            marginBottom: 14,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {hw.description || 'Open task to view details and submit solution.'}
                        </p>

                        {/* Metadata strip */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '12px', color: 'var(--text-muted)', marginBottom: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} color="var(--brand-primary)" />
                            <span>Due: <strong>{new Date(hw.dueDate).toLocaleDateString()}</strong></span>
                          </div>
                          <span>•</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Award size={12} color="#f59e0b" />
                            <span>{hw.maxMarks} Pts</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div
                        style={{
                          paddingTop: 14,
                          borderTop: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {hw.className} - {hw.sectionName}
                        </span>

                        <div style={{ display: 'flex', gap: 6 }}>
                          {isTeacherOrAdmin ? (
                            <>
                              <button
                                onClick={() => setSelectedHwIdForTeacher(hw.id)}
                                className="btn btn-primary btn-sm"
                                style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                              >
                                <Award size={13} />
                                <span>Submissions & Grade ({hw.submissionsCount})</span>
                              </button>
                              <button
                                onClick={() => handleDeleteItem(hw.id, hw.title)}
                                className="btn btn-secondary btn-sm"
                                style={{ color: 'var(--status-danger)' }}
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setSelectedHwForStudent(hw)}
                              className="btn btn-primary btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                            >
                              <Send size={13} />
                              <span>{isSubmitted ? 'View Submission' : 'Turn In Work'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {assignments.length === 0 && (
                <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                  <FileText size={40} color="var(--text-subtle)" style={{ margin: '0 auto 12px' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                    No Assignments Found
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: 4 }}>
                    There are no assignments matching the selected filter.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ======================================================== */}
      {/* PUBLISH DIARY ENTRY / ASSIGNMENT MODAL (FOR TEACHERS/ADMIN) */}
      {/* ======================================================== */}
      <Modal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        title={publishType === 'DIARY' ? 'Publish Daily School Diary Note' : 'Create Academic Homework Assignment'}
        maxWidth="680px"
      >
        <form onSubmit={handlePublish}>
          {formError && (
            <div style={{ padding: '10px 14px', backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)', borderRadius: 6, fontSize: '13px', marginBottom: 16 }}>
              {formError}
            </div>
          )}

          {/* Toggle Type Selector */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-surface-subtle)',
              padding: 4,
              borderRadius: 'var(--radius-sm)',
              marginBottom: 18,
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={() => setPublishType('DIARY')}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: publishType === 'DIARY' ? 700 : 500,
                backgroundColor: publishType === 'DIARY' ? 'var(--brand-primary)' : 'transparent',
                color: publishType === 'DIARY' ? '#fff' : 'var(--text-muted)',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              📖 Daily School Diary (Almanac)
            </button>
            <button
              type="button"
              onClick={() => setPublishType('HOMEWORK')}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: publishType === 'HOMEWORK' ? 700 : 500,
                backgroundColor: publishType === 'HOMEWORK' ? 'var(--brand-primary)' : 'transparent',
                color: publishType === 'HOMEWORK' ? '#fff' : 'var(--text-muted)',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              🎯 Homework Assignment with Turn-In
            </button>
          </div>

          {/* Class & Subject Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Class & Section *</label>
              <select
                className="select"
                value={publishForm.sectionId}
                onChange={(e) => setPublishForm({ ...publishForm, sectionId: e.target.value })}
                required
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.className} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Subject *</label>
              <select
                className="select"
                value={publishForm.subjectId}
                onChange={(e) => setPublishForm({ ...publishForm, subjectId: e.target.value })}
                required
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Title / Topic *</label>
            <input
              type="text"
              className="input"
              placeholder={publishType === 'DIARY' ? 'e.g. Chapter 4 Fractions & Decimals' : 'e.g. Essay on Climate Change Impact'}
              value={publishForm.title}
              onChange={(e) => setPublishForm({ ...publishForm, title: e.target.value })}
              required
            />
          </div>

          {/* Specific Diary Fields */}
          {publishType === 'DIARY' ? (
            <>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Classwork Covered Today (What was taught in class):</label>
                <textarea
                  className="input"
                  style={{ minHeight: '75px', resize: 'vertical' }}
                  placeholder="e.g. Completed Chapter 4, exercises 4.1 to 4.3 on the blackboard. Practiced problem solving."
                  value={publishForm.classwork}
                  onChange={(e) => setPublishForm({ ...publishForm, classwork: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Homework Assigned for Home:</label>
                <textarea
                  className="input"
                  style={{ minHeight: '75px', resize: 'vertical' }}
                  placeholder="e.g. Solve workbook page 38, questions 1 through 10 in the homework notebook."
                  value={publishForm.description}
                  onChange={(e) => setPublishForm({ ...publishForm, description: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ color: 'var(--status-danger)' }}>
                  📢 Urgent Note to Parents (Optional):
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Please bring watercolor and sketch pen set tomorrow for art competition."
                  value={publishForm.parentNotice}
                  onChange={(e) => setPublishForm({ ...publishForm, parentNotice: e.target.value })}
                />
              </div>
            </>
          ) : (
            <>
              {/* Specific Assignment Fields */}
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Assignment Briefing & Problem Description:</label>
                <textarea
                  className="input"
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  placeholder="Explain instructions, criteria, and what students must submit..."
                  value={publishForm.description}
                  onChange={(e) => setPublishForm({ ...publishForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">Submission Due Date *</label>
                  <input
                    type="date"
                    className="input"
                    value={publishForm.dueDate}
                    onChange={(e) => setPublishForm({ ...publishForm, dueDate: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Maximum Evaluation Marks</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="input"
                    value={publishForm.maxMarks}
                    onChange={(e) => setPublishForm({ ...publishForm, maxMarks: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Attached Study Materials / Google Drive Link (Optional):</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://drive.google.com/..."
                  value={publishForm.resourceLinks}
                  onChange={(e) => setPublishForm({ ...publishForm, resourceLinks: e.target.value })}
                />
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
            <button type="button" onClick={() => setIsPublishModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={publishing}>
              {publishing ? 'Publishing...' : publishType === 'DIARY' ? 'Publish Diary Entry' : 'Publish Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* PARENT SIGNATURE MODAL */}
      {/* ======================================================== */}
      <Modal
        isOpen={!!signModalHw}
        onClose={() => setSignModalHw(null)}
        title="Sign Daily School Diary"
        maxWidth="500px"
      >
        <div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-main)', marginBottom: 14, lineHeight: 1.5 }}>
            By signing, you acknowledge that you have reviewed today's classwork and homework tasks for{' '}
            <strong>{signModalHw?.subjectName}</strong>.
          </p>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">
              Optional Note / Excuse to the Teacher:
            </label>
            <textarea
              className="input"
              style={{ minHeight: '80px', resize: 'vertical' }}
              placeholder="e.g. Reviewed with child. He completed 8 out of 10 problems tonight."
              value={parentReplyNote}
              onChange={(e) => setParentReplyNote(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={() => setSignModalHw(null)} className="btn btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleSignDiary}
              className="btn btn-primary"
              disabled={signing}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ShieldCheck size={15} />
              <span>{signing ? 'Signing...' : 'Confirm Digital Signature'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Student Submission Slide-Over Drawer */}
      <StudentSubmissionDrawer
        homework={selectedHwForStudent}
        onClose={() => setSelectedHwForStudent(null)}
        onSubmitted={() => {
          setSelectedHwForStudent(null);
          loadData();
        }}
      />

      {/* Teacher Grading Slide-Over Drawer */}
      <TeacherGradingDrawer
        homeworkId={selectedHwIdForTeacher}
        onClose={() => setSelectedHwIdForTeacher(null)}
        onGraded={() => {
          loadData();
        }}
      />

      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        isSuperAdmin={user?.isSuperAdmin}
      />
    </div>
  );
}
