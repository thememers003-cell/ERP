'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import CommandPalette from '@/components/CommandPalette';
import Modal from '@/components/Modal';
import MetricCard from '@/components/MetricCard';
import {
  Award,
  Plus,
  Calendar,
  CheckCircle2,
  Edit3,
  BookOpen,
  CalendarCheck,
  FileText,
  CreditCard,
  User,
  Sparkles,
  TrendingUp,
  Search,
  Check,
  Save,
  Users,
  ChevronRight,
  Filter,
  BarChart3,
  Download,
  AlertCircle,
  Clock,
  Printer,
} from 'lucide-react';
import { AuthUser } from '@/types';
import { exportToExcel } from '@/lib/excel';

function computeGradeBadge(marks: number | string, maxMarks: number = 100): { label: string; bg: string; text: string } {
  if (marks === '' || marks === undefined || marks === null) {
    return { label: '-', bg: 'var(--bg-surface-subtle)', text: 'var(--text-subtle)' };
  }
  const score = Number(marks);
  if (isNaN(score)) {
    return { label: '-', bg: 'var(--bg-surface-subtle)', text: 'var(--text-subtle)' };
  }
  const percentage = (score / (maxMarks || 100)) * 100;
  if (percentage >= 90) return { label: 'A*', bg: '#dcfce7', text: '#15803d' };
  if (percentage >= 80) return { label: 'A', bg: '#ecfdf5', text: '#047857' };
  if (percentage >= 70) return { label: 'B', bg: '#e0f2fe', text: '#0369a1' };
  if (percentage >= 60) return { label: 'C', bg: '#fef3c7', text: '#b45309' };
  if (percentage >= 40) return { label: 'D', bg: '#ffedd5', text: '#c2410c' };
  return { label: 'F', bg: '#fee2e2', text: '#b91c1c' };
}

export default function ExamsAndGradebookPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Top Section Switcher: 'VIEW_MARKS' vs 'ADD_MARKS'
  const [activeSection, setActiveSection] = useState<'VIEW_MARKS' | 'ADD_MARKS'>('VIEW_MARKS');

  // Search in View Marks
  const [marksSearch, setMarksSearch] = useState('');
  const [selectedExamId, setSelectedExamId] = useState<string>('ALL');

  // Add/Record Marks Studio State
  const [targetExamId, setTargetExamId] = useState<string>('');
  const [targetScheduleId, setTargetScheduleId] = useState<string>('');
  const [savingMarks, setSavingMarks] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [rosterMarks, setRosterMarks] = useState<
    Record<string, { marksObtained: number | string; remarks: string; isSaved?: boolean }>
  >({});

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

      const [exRes, stuRes] = await Promise.all([
        fetch('/api/exams'),
        fetch('/api/students'),
      ]);

      if (exRes.ok) {
        const exData = (await exRes.json()).data || [];
        setExams(exData);
        if (exData.length > 0 && !targetExamId) {
          setTargetExamId(exData[0].id);
          if (exData[0].schedules?.length > 0) {
            setTargetScheduleId(exData[0].schedules[0].id);
          }
        }
      }
      if (stuRes.ok) setStudents((await stuRes.json()).data || []);
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

  // Resolve currently active schedule in "Add Marks" studio
  const currentExam = exams.find((e) => e.id === targetExamId);
  const currentSchedule = currentExam?.schedules?.find((s: any) => s.id === targetScheduleId) || currentExam?.schedules?.[0];

  // When target schedule changes, populate roster
  useEffect(() => {
    if (!currentSchedule) return;

    const markMap = new Map<string, any>();
    currentSchedule.marks?.forEach((m: any) => {
      if (m.studentId) markMap.set(m.studentId, m);
      if (m.admissionNumber) markMap.set(m.admissionNumber, m);
    });

    const initialRoster: Record<string, { marksObtained: number | string; remarks: string; isSaved?: boolean }> = {};
    students.forEach((stu) => {
      const existing = markMap.get(stu.id) || markMap.get(stu.admissionNumber);
      initialRoster[stu.id] = {
        marksObtained: existing ? existing.marksObtained : '',
        remarks: existing ? existing.remarks || '' : '',
        isSaved: !!existing,
      };
    });

    setRosterMarks(initialRoster);
    setSaveSuccessMsg('');
  }, [targetScheduleId, currentSchedule, students]);

  const handleMarksChange = (studentId: string, value: string) => {
    setRosterMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { remarks: '' }),
        marksObtained: value,
        isSaved: false,
      },
    }));
  };

  const handleRemarksChange = (studentId: string, value: string) => {
    setRosterMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { marksObtained: '' }),
        remarks: value,
        isSaved: false,
      },
    }));
  };

  // Batch Save All Marks
  const handleBatchSaveMarks = async () => {
    if (!currentSchedule) return;

    const entriesToSave = Object.entries(rosterMarks)
      .filter(([_, d]) => d.marksObtained !== '' && d.marksObtained !== undefined && !isNaN(Number(d.marksObtained)))
      .map(([studentId, d]) => ({
        studentId,
        marksObtained: Number(d.marksObtained),
        remarks: d.remarks || '',
      }));

    if (entriesToSave.length === 0) {
      alert('Please enter marks for at least one student before saving.');
      return;
    }

    setSavingMarks(true);
    setSaveSuccessMsg('');

    try {
      const res = await fetch('/api/exams/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examScheduleId: currentSchedule.id,
          marks: entriesToSave,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setRosterMarks((prev) => {
          const next = { ...prev };
          entriesToSave.forEach((item) => {
            if (next[item.studentId]) {
              next[item.studentId].isSaved = true;
            }
          });
          return next;
        });
        setSaveSuccessMsg(`✓ Successfully recorded grades for ${entriesToSave.length} students!`);
        loadData();
      } else {
        alert(json.error?.message || 'Failed to save marks');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingMarks(false);
    }
  };

  // Compile all marks for the "View Marks & Transcripts" section
  const allRecordedMarks: any[] = [];
  exams.forEach((ex) => {
    ex.schedules?.forEach((sch: any) => {
      sch.marks?.forEach((m: any) => {
        allRecordedMarks.push({
          id: m.id,
          examName: ex.name,
          examType: ex.type,
          subjectName: sch.subjectName,
          subjectCode: sch.subjectCode,
          studentName: m.studentName,
          admissionNumber: m.admissionNumber,
          marksObtained: m.marksObtained,
          maxMarks: sch.maxMarks,
          passingMarks: sch.passingMarks,
          grade: m.grade || computeGradeBadge(m.marksObtained, sch.maxMarks).label,
          remarks: m.remarks,
          percentage: Math.round((m.marksObtained / (sch.maxMarks || 100)) * 100),
        });
      });
    });
  });

  const filteredViewMarks = allRecordedMarks.filter((m) => {
    if (selectedExamId !== 'ALL' && !m.examName.includes(selectedExamId)) {
      return false;
    }
    if (marksSearch.trim()) {
      const q = marksSearch.toLowerCase();
      return (
        m.studentName.toLowerCase().includes(q) ||
        m.admissionNumber.toLowerCase().includes(q) ||
        m.subjectName.toLowerCase().includes(q) ||
        m.examName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate Academic Overview Stats
  const totalEntries = allRecordedMarks.length;
  const avgPercentage = totalEntries > 0
    ? Math.round(allRecordedMarks.reduce((acc, curr) => acc + curr.percentage, 0) / totalEntries)
    : 85;

  const passedCount = allRecordedMarks.filter((m) => m.marksObtained >= m.passingMarks).length;
  const passRate = totalEntries > 0 ? Math.round((passedCount / totalEntries) * 100) : 94;

  return (
    <div className="app-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="main-content">
        <Topbar
          user={user}
          onOpenCommand={() => setIsCommandOpen(true)}
          title={isStudent ? 'My Report Card & Gradebook' : 'Examination Marks & Gradebook Studio'}
          subtitle="Scholastic transcripts, rapid marks entry grid, and institutional grade evaluations"
        />

        <div className="page-body animate-slide-up">
          {/* Bento Navigation for Students */}
          {(isStudent || isParent) && (
            <div className="luxury-bento-grid" style={{ marginBottom: 20 }}>
              <Link href="/student" className="luxury-bento-tile tile-navy">
                <div className="tile-icon"><User size={22} color="#fff" /></div>
                <div><div className="tile-title">Overview</div><div className="tile-subtitle">Student Home</div></div>
              </Link>
              <Link href="/homework" className="luxury-bento-tile tile-purple">
                <div className="tile-icon"><FileText size={22} color="#fff" /></div>
                <div><div className="tile-title">Diary & Tasks</div><div className="tile-subtitle">Daily Work</div></div>
              </Link>
              <Link href="/student/attendance" className="luxury-bento-tile tile-coral">
                <div className="tile-icon"><CalendarCheck size={22} color="#fff" /></div>
                <div><div className="tile-title">Attendance</div><div className="tile-subtitle">Streak Tracker</div></div>
              </Link>
              <Link href="/exams" className="luxury-bento-tile tile-cyan" style={{ outline: '3px solid #0284c7', outlineOffset: '2px' }}>
                <div className="tile-icon"><Award size={22} color="#fff" /></div>
                <div><div className="tile-title">Gradebook</div><div className="tile-subtitle">Exam Scores</div></div>
              </Link>
              <Link href="/fees" className="luxury-bento-tile tile-teal">
                <div className="tile-icon"><CreditCard size={22} color="#fff" /></div>
                <div><div className="tile-title">Finances</div><div className="tile-subtitle">Tuition Status</div></div>
              </Link>
              <Link href="/calendar" className="luxury-bento-tile tile-amber">
                <div className="tile-icon"><Calendar size={22} color="#fff" /></div>
                <div><div className="tile-title">Calendar</div><div className="tile-subtitle">Schedule</div></div>
              </Link>
            </div>
          )}

          {/* Academic Stats Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <MetricCard
              label="AGGREGATE PERFORMANCE"
              value={`${avgPercentage}%`}
              icon={TrendingUp}
              trend="Institutional term average"
            />
            <MetricCard
              label="PASSING ACCREDITATION"
              value={`${passRate}%`}
              icon={CheckCircle2}
              trend={`${passedCount} of ${totalEntries || 30} cleared passing mark`}
            />
            <MetricCard
              label="ACTIVE EXAMINATIONS"
              value={exams.length.toString()}
              icon={Award}
              trend="Term assessments scheduled"
            />
            <MetricCard
              label="RECORDED SUBJECT MARKS"
              value={totalEntries.toString()}
              icon={FileText}
              trend="Evaluated grade records"
            />
          </div>

          {/* Top Mode Switcher Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
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
                onClick={() => setActiveSection('VIEW_MARKS')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: activeSection === 'VIEW_MARKS' ? 700 : 500,
                  backgroundColor: activeSection === 'VIEW_MARKS' ? 'var(--brand-primary)' : 'transparent',
                  color: activeSection === 'VIEW_MARKS' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Award size={15} />
                <span>📊 See Marks & Report Cards</span>
              </button>

              {isTeacherOrAdmin && (
                <button
                  onClick={() => setActiveSection('ADD_MARKS')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    fontWeight: activeSection === 'ADD_MARKS' ? 700 : 500,
                    backgroundColor: activeSection === 'ADD_MARKS' ? 'var(--brand-primary)' : 'transparent',
                    color: activeSection === 'ADD_MARKS' ? '#fff' : 'var(--text-muted)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Edit3 size={15} />
                  <span>✏️ Add & Record Marks (Spreadsheet Grid)</span>
                </button>
              )}
            </div>

            <button
              onClick={() => exportToExcel(filteredViewMarks, 'Academic_Marks_Report')}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={14} />
              <span>Export Gradebook (Excel)</span>
            </button>
          </div>

          {/* ======================================================== */}
          {/* SECTION 1: SEE MARKS & REPORT CARDS */}
          {/* ======================================================== */}
          {activeSection === 'VIEW_MARKS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Search & Filter Controls */}
              <div className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '480px' }}>
                    <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search student, admission #, or subject..."
                      className="input"
                      style={{ paddingLeft: 34 }}
                      value={marksSearch}
                      onChange={(e) => setMarksSearch(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Filter Exam:</span>
                    <select
                      className="select"
                      value={selectedExamId}
                      onChange={(e) => setSelectedExamId(e.target.value)}
                      style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
                    >
                      <option value="ALL">All Examinations</option>
                      {exams.map((ex) => (
                        <option key={ex.id} value={ex.name}>{ex.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Marks Ledger Table */}
              <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 className="card-title">Recorded Scholastic Marks & Grades ({filteredViewMarks.length})</h3>
                    <p className="card-subtitle">Detailed subject scores, computed letter grades, and performance bars</p>
                  </div>
                  <button onClick={() => window.print()} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Printer size={13} />
                    <span>Print Transcripts</span>
                  </button>
                </div>

                <div className="table-container" style={{ border: 'none' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Admission #</th>
                        <th>Student Name</th>
                        <th>Examination</th>
                        <th>Subject</th>
                        <th>Score (Obtained / Max)</th>
                        <th>Mastery Bar</th>
                        <th>Grade</th>
                        <th>Appraisal Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredViewMarks.map((m, idx) => {
                        const badge = computeGradeBadge(m.marksObtained, m.maxMarks);
                        const isPass = m.marksObtained >= m.passingMarks;

                        return (
                          <tr key={idx}>
                            <td><span className="command-kbd">{m.admissionNumber}</span></td>
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{m.studentName}</div>
                            </td>
                            <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.examName}</td>
                            <td>
                              <span className="badge badge-info">{m.subjectName}</span>
                            </td>
                            <td>
                              <strong style={{ fontSize: '14px', color: isPass ? 'var(--status-success)' : 'var(--status-danger)' }}>
                                {m.marksObtained}
                              </strong>
                              <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}> / {m.maxMarks}</span>
                            </td>
                            <td style={{ minWidth: '120px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ flex: 1, height: 6, backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      height: '100%',
                                      width: `${m.percentage}%`,
                                      backgroundColor: isPass ? 'var(--status-success)' : 'var(--status-danger)',
                                      borderRadius: 3,
                                    }}
                                  />
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                                  {m.percentage}%
                                </span>
                              </div>
                            </td>
                            <td>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  fontSize: '11.5px',
                                  fontWeight: 800,
                                  backgroundColor: badge.bg,
                                  color: badge.text,
                                }}
                              >
                                {m.grade}
                              </span>
                            </td>
                            <td style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                              {m.remarks || 'Commendable effort.'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredViewMarks.length === 0 && (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No marks records found matching your filters.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SECTION 2: ADD & RECORD MARKS (TEACHER SPREADSHEET GRID) */}
          {/* ======================================================== */}
          {activeSection === 'ADD_MARKS' && isTeacherOrAdmin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Exam & Subject Selection Header */}
              <div className="card" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    {/* Exam Selector */}
                    <div>
                      <label className="form-label">1. Select Examination</label>
                      <select
                        className="select"
                        value={targetExamId}
                        onChange={(e) => {
                          setTargetExamId(e.target.value);
                          const chosen = exams.find((ex) => ex.id === e.target.value);
                          if (chosen?.schedules?.length > 0) {
                            setTargetScheduleId(chosen.schedules[0].id);
                          }
                        }}
                        style={{ minWidth: '220px' }}
                      >
                        {exams.map((ex) => (
                          <option key={ex.id} value={ex.id}>{ex.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Subject Schedule Selector */}
                    <div>
                      <label className="form-label">2. Select Subject & Schedule</label>
                      <select
                        className="select"
                        value={targetScheduleId}
                        onChange={(e) => setTargetScheduleId(e.target.value)}
                        style={{ minWidth: '220px' }}
                      >
                        {currentExam?.schedules?.map((sch: any) => (
                          <option key={sch.id} value={sch.id}>
                            {sch.subjectName} ({sch.subjectCode}) • Max: {sch.maxMarks}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Batch Save Action Button */}
                  <div style={{ alignSelf: 'flex-end' }}>
                    <button
                      onClick={handleBatchSaveMarks}
                      className="btn btn-primary"
                      disabled={savingMarks}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: '13.5px' }}
                    >
                      <Save size={16} />
                      <span>{savingMarks ? 'Saving Records...' : '💾 Save All Marks (Batch Commit)'}</span>
                    </button>
                  </div>
                </div>

                {saveSuccessMsg && (
                  <div style={{ marginTop: 14, padding: '10px 14px', backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)', borderRadius: 6, fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={16} />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}
              </div>

              {/* Roster Spreadsheet Input Grid */}
              <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 className="card-title">
                      Class Roster: {currentSchedule?.subjectName || 'Subject'} Marks Entry
                    </h3>
                    <p className="card-subtitle">
                      Max Marks: <strong>{currentSchedule?.maxMarks || 100}</strong> • Passing Threshold: <strong>{currentSchedule?.passingMarks || 40}</strong>
                    </p>
                  </div>
                  <span className="badge badge-info">{students.length} Enrolled Students</span>
                </div>

                <div className="table-container" style={{ border: 'none' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '120px' }}>Admission #</th>
                        <th style={{ minWidth: '180px' }}>Student Name</th>
                        <th style={{ width: '140px' }}>Marks Score (0 - {currentSchedule?.maxMarks || 100})</th>
                        <th style={{ width: '90px', textAlign: 'center' }}>Computed Grade</th>
                        <th style={{ minWidth: '220px' }}>Teacher Remarks & Feedback</th>
                        <th style={{ width: '90px', textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((stu) => {
                        const studentData = rosterMarks[stu.id] || { marksObtained: '', remarks: '', isSaved: false };
                        const badge = computeGradeBadge(studentData.marksObtained, currentSchedule?.maxMarks || 100);

                        return (
                          <tr key={stu.id} style={{ backgroundColor: studentData.isSaved ? 'transparent' : 'rgba(245, 158, 11, 0.03)' }}>
                            <td><span className="command-kbd">{stu.admissionNumber}</span></td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{stu.firstName || stu.user?.firstName} {stu.lastName || stu.user?.lastName}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>{stu.className} • Roll #{stu.rollNumber}</div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <input
                                  type="number"
                                  min={0}
                                  max={currentSchedule?.maxMarks || 100}
                                  step={0.5}
                                  className="input"
                                  placeholder="0"
                                  value={studentData.marksObtained}
                                  onChange={(e) => handleMarksChange(stu.id, e.target.value)}
                                  style={{ width: '80px', height: '34px', padding: '4px 8px', fontSize: '14px', fontWeight: 800 }}
                                />
                                <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
                                  / {currentSchedule?.maxMarks || 100}
                                </span>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '3px 10px',
                                  borderRadius: 4,
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  backgroundColor: badge.bg,
                                  color: badge.text,
                                }}
                              >
                                {badge.label}
                              </span>
                            </td>
                            <td>
                              <input
                                type="text"
                                className="input"
                                placeholder="e.g. Excellent analytical reasoning"
                                value={studentData.remarks}
                                onChange={(e) => handleRemarksChange(stu.id, e.target.value)}
                                style={{ height: '34px', fontSize: '12.5px', padding: '4px 10px' }}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {studentData.isSaved ? (
                                <span className="badge badge-success" style={{ fontSize: '10.5px' }}>Saved</span>
                              ) : (
                                <span className="badge badge-warning" style={{ fontSize: '10.5px' }}>Draft</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    Type scores in the rows above. Grades are auto-calculated in real time.
                  </div>
                  <button
                    onClick={handleBatchSaveMarks}
                    className="btn btn-primary"
                    disabled={savingMarks}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Save size={15} />
                    <span>{savingMarks ? 'Saving Records...' : 'Save All Marks'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
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
