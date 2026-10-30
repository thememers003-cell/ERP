'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Save,
  Search,
  Filter,
  Users,
  Send,
  Sparkles,
} from 'lucide-react';

interface TeacherGradingDrawerProps {
  homeworkId: string | null;
  onClose: () => void;
  onGraded: () => void;
}

export default function TeacherGradingDrawer({
  homeworkId,
  onClose,
  onGraded,
}: TeacherGradingDrawerProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [marksInput, setMarksInput] = useState<number | string>('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'SUBMITTED' | 'MISSING' | 'EVALUATED'>('ALL');
  const [search, setSearch] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadDetails = async () => {
    if (!homeworkId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/homework/${homeworkId}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        // Default select first submitted student
        const firstSubmitted = json.data.submissions?.[0];
        if (firstSubmitted) {
          selectStudent(firstSubmitted);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [homeworkId]);

  const selectStudent = (submission: any) => {
    setSelectedStudent(submission);
    setMarksInput(submission.marksAwarded ?? '');
    setFeedbackInput(submission.feedback || '');
    setSuccessMsg('');
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !homeworkId) return;

    setSavingGrade(true);
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/homework/${homeworkId}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedStudent.id,
          studentId: selectedStudent.studentId,
          marksAwarded: Number(marksInput),
          feedback: feedbackInput,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to grade submission');
      }

      setSuccessMsg('Grade and feedback saved successfully!');
      onGraded();
      loadDetails();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingGrade(false);
    }
  };

  if (!homeworkId) return null;

  const submissions = data?.submissions || [];
  const enrolledStudents = data?.section?.students || [];

  // Build complete roster
  const roster = enrolledStudents.map((stu: any) => {
    const sub = submissions.find((s: any) => s.studentId === stu.id);
    return {
      studentId: stu.id,
      studentName: `${stu.user.firstName} ${stu.user.lastName}`,
      studentEmail: stu.user.email,
      submission: sub || null,
      status: sub ? sub.status : 'MISSING',
    };
  });

  const filteredRoster = roster.filter((item: any) => {
    if (filter === 'SUBMITTED') return item.status === 'SUBMITTED' || item.status === 'LATE';
    if (filter === 'EVALUATED') return item.status === 'EVALUATED';
    if (filter === 'MISSING') return item.status === 'MISSING';
    return true;
  }).filter((item: any) =>
    item.studentName.toLowerCase().includes(search.toLowerCase())
  );

  const turnedInCount = roster.filter((r: any) => r.status !== 'MISSING').length;
  const gradedCount = roster.filter((r: any) => r.status === 'EVALUATED').length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '880px',
          height: '100vh',
          backgroundColor: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-subtle)',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'linear-gradient(180deg, var(--bg-surface-subtle) 0%, var(--bg-surface) 100%)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge badge-primary">EVALUATION STUDIO</span>
              <span className="badge badge-info">{data?.subject?.name || 'Subject'}</span>
              <span className="badge badge-neutral">{data?.section?.class?.name} - {data?.section?.name}</span>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: 6,
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
              }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {data?.title || 'Assignment Evaluation'}
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Total Weight: <strong style={{ color: 'var(--brand-primary)' }}>{data?.maxMarks || 50} Marks</strong>
            </div>
          </div>

          {/* Turn-in Progress Bar */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              <span>{turnedInCount} of {roster.length} Turned In ({Math.round((turnedInCount / (roster.length || 1)) * 100)}%)</span>
              <span>{gradedCount} Evaluated</span>
            </div>
            <div style={{ height: 6, width: '100%', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(turnedInCount / (roster.length || 1)) * 100}%`,
                  backgroundColor: 'var(--status-success)',
                  borderRadius: 3,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* Content Body: Two Columns */}
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Loading student submissions...
          </div>
        ) : (
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '320px 1fr', overflow: 'hidden' }}>
            {/* Left Roster Panel */}
            <div
              style={{
                borderRight: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--bg-surface-subtle)',
              }}
            >
              {/* Search & Filter pills */}
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
                <input
                  type="text"
                  placeholder="Search student..."
                  className="input"
                  style={{ fontSize: '12.5px', padding: '6px 10px', marginBottom: 8 }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {(['ALL', 'SUBMITTED', 'EVALUATED', 'MISSING'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: filter === f ? 700 : 500,
                        backgroundColor: filter === f ? 'var(--brand-primary)' : 'var(--bg-surface)',
                        color: filter === f ? '#fff' : 'var(--text-muted)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Roster List */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filteredRoster.map((item: any) => {
                  const isSelected = selectedStudent?.studentId === item.studentId;
                  const isSubmitted = item.status === 'SUBMITTED' || item.status === 'LATE';
                  const isGraded = item.status === 'EVALUATED';

                  return (
                    <div
                      key={item.studentId}
                      onClick={() => {
                        if (item.submission) {
                          selectStudent(item.submission);
                        } else {
                          setSelectedStudent({
                            studentId: item.studentId,
                            studentName: item.studentName,
                            content: null,
                            attachments: null,
                            status: 'MISSING',
                          });
                          setMarksInput('');
                          setFeedbackInput('');
                        }
                      }}
                      style={{
                        padding: '12px 14px',
                        borderBottom: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'var(--bg-surface)' : 'transparent',
                        borderLeft: isSelected ? '3px solid var(--brand-primary)' : '3px solid transparent',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                          {item.studentName}
                        </div>
                        <span
                          className={`badge ${
                            isGraded
                              ? 'badge-success'
                              : isSubmitted
                              ? 'badge-primary'
                              : 'badge-danger'
                          }`}
                          style={{ fontSize: '10px', padding: '1px 5px' }}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: 2 }}>
                        {item.submission
                          ? `Turned in: ${new Date(item.submission.submittedAt).toLocaleDateString()}`
                          : 'No submission yet'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Grading & Work Preview Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '24px' }}>
              {selectedStudent ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: '17px', fontWeight: 800 }}>
                        {selectedStudent.studentName || selectedStudent.student?.user?.firstName + ' ' + selectedStudent.student?.user?.lastName}
                      </h3>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>
                        Status: <strong style={{ color: selectedStudent.status === 'MISSING' ? 'var(--status-danger)' : 'var(--status-success)' }}>{selectedStudent.status}</strong>
                      </div>
                    </div>
                  </div>

                  {successMsg && (
                    <div style={{ padding: '10px 14px', backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)', borderRadius: 6, fontSize: '13px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={16} />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  {/* Submission Work Preview */}
                  <div className="card" style={{ padding: '16px', marginBottom: 20 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-subtle)', marginBottom: 8, textTransform: 'uppercase' }}>
                      Student's Submitted Work
                    </div>

                    {selectedStudent.status === 'MISSING' ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '13px' }}>
                        This student has not submitted any work for this assignment yet.
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: '13.5px', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-main)', marginBottom: 14 }}>
                          {selectedStudent.content || 'No text response entered.'}
                        </div>

                        {selectedStudent.attachments && (
                          <div style={{ paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                            <a
                              href={selectedStudent.attachments.startsWith('http') ? selectedStudent.attachments : `https://${selectedStudent.attachments}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            >
                              <ExternalLink size={13} />
                              <span>Open Student's Attached File / Link</span>
                            </a>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Teacher Grading Form */}
                  {selectedStudent.status !== 'MISSING' && (
                    <form onSubmit={handleSaveGrade} className="card" style={{ padding: '18px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: 14 }}>
                        Score & Private Feedback
                      </h4>

                      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 14, marginBottom: 14 }}>
                        <div className="form-group">
                          <label className="form-label">
                            Marks (Max {data?.maxMarks || 50}) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={data?.maxMarks || 50}
                            step="0.5"
                            className="input"
                            value={marksInput}
                            onChange={(e) => setMarksInput(e.target.value)}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">
                            Private Teacher Feedback
                          </label>
                          <input
                            type="text"
                            className="input"
                            placeholder="e.g. Excellent analysis, clear calculations!"
                            value={feedbackInput}
                            onChange={(e) => setFeedbackInput(e.target.value)}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={savingGrade}
                          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <Save size={14} />
                          <span>{savingGrade ? 'Saving Grade...' : 'Return Grade to Student'}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  Select a student from the left roster to view submission and award marks.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
