'use client';

import React, { useState } from 'react';
import {
  X,
  FileText,
  Clock,
  Calendar,
  Award,
  Send,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Link as LinkIcon,
  BookOpen,
} from 'lucide-react';

interface StudentSubmissionDrawerProps {
  homework: any | null;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function StudentSubmissionDrawer({
  homework,
  onClose,
  onSubmitted,
}: StudentSubmissionDrawerProps) {
  const [content, setContent] = useState(homework?.mySubmission?.content || '');
  const [attachmentUrl, setAttachmentUrl] = useState(homework?.mySubmission?.attachments || '');
  const [submitting, setSubmitting] = useState(false);
  const [unsubmitting, setUnsubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!homework) return null;

  const mySub = homework.mySubmission;
  const isEvaluated = mySub?.status === 'EVALUATED';
  const isSubmitted = mySub?.status === 'SUBMITTED' || mySub?.status === 'LATE' || isEvaluated;

  const dueDate = new Date(homework.dueDate);
  const isPastDue = new Date() > dueDate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/homework/${homework.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          attachments: attachmentUrl,
          action: 'SUBMIT',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to submit assignment');
      }

      onSubmitted();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnsubmit = async () => {
    if (!confirm('Are you sure you want to unsubmit? You can make changes and turn it in again before the due date.')) {
      return;
    }

    setUnsubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/homework/${homework.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UNSUBMIT' }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to unsubmit');
      }

      onSubmitted();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUnsubmitting(false);
    }
  };

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
          maxWidth: '680px',
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
            padding: '24px 28px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'linear-gradient(180deg, var(--bg-surface-subtle) 0%, var(--bg-surface) 100%)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge badge-info" style={{ fontWeight: 700 }}>
                {homework.subjectName}
              </span>
              <span className="badge badge-neutral">
                {homework.className} - {homework.sectionName}
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
                style={{ fontWeight: 800 }}
              >
                {isEvaluated
                  ? 'GRADED / EVALUATED'
                  : isSubmitted
                  ? mySub.status === 'LATE' ? 'TURNED IN (LATE)' : 'TURNED IN'
                  : isPastDue
                  ? 'MISSING / PAST DUE'
                  : 'ASSIGNED / DUE SOON'}
              </span>
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

          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {homework.title}
          </h2>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginTop: 8,
              fontSize: '12.5px',
              color: 'var(--text-muted)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={13} color="var(--brand-primary)" />
              <span>Due: <strong>{new Date(homework.dueDate).toLocaleDateString()}</strong></span>
            </div>
            <span>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Award size={13} color="#f59e0b" />
              <span>Points: <strong>{homework.maxMarks} Max Pts</strong></span>
            </div>
            <span>•</span>
            <span>By: <strong>{homework.teacherName}</strong></span>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Graded Score Card (if evaluated) */}
          {isEvaluated && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                border: '1px solid var(--status-success)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--status-success)', letterSpacing: '0.04em' }}>
                    TEACHER EVALUATION & MARKS
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>
                    {mySub.marksAwarded} <span style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 500 }}>/ {homework.maxMarks} Marks</span>
                  </div>
                </div>
                <div
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--status-success)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '14px',
                  }}
                >
                  {Math.round(((mySub.marksAwarded || 0) / homework.maxMarks) * 100)}%
                </div>
              </div>

              {mySub.feedback && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '13px' }}>
                  <strong style={{ color: 'var(--status-success)' }}>Teacher Feedback: </strong>
                  <span style={{ color: 'var(--text-main)' }}>{mySub.feedback}</span>
                </div>
              )}
            </div>
          )}

          {/* Assignment Description & Instructions */}
          <div className="card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: 10 }}>
              Assignment Briefing & Instructions
            </h4>
            <p style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {homework.description || 'No additional instructions provided. Please submit your work on or before the due date.'}
            </p>

            {/* Attached Reference Links */}
            {homework.resourceLinks && homework.resourceLinks.length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                  ATTACHED STUDY MATERIALS / REFERENCE LINKS:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {homework.resourceLinks.map((url: string, idx: number) => (
                    <a
                      key={idx}
                      href={url.startsWith('http') ? url : `https://${url}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: '13px',
                        color: 'var(--brand-primary)',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      <ExternalLink size={13} />
                      <span>{url}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Student Work Submission Box */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h4 style={{ fontSize: '14.5px', fontWeight: 700 }}>Your Work & Submission</h4>
              {isSubmitted && !isEvaluated && (
                <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={12} />
                  <span>Turned in on {new Date(mySub.submittedAt).toLocaleDateString()}</span>
                </span>
              )}
            </div>

            {error && (
              <div style={{ padding: 10, backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)', borderRadius: 6, fontSize: '13px', marginBottom: 14 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">
                  Written Response / Solution Notes:
                </label>
                <textarea
                  className="input"
                  style={{ minHeight: '120px', fontFamily: 'inherit', resize: 'vertical' }}
                  placeholder="Type your response, working steps, or submission summary here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isEvaluated}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">
                  External File / Google Drive / Project Link:
                </label>
                <div style={{ position: 'relative' }}>
                  <LinkIcon size={14} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                  <input
                    type="url"
                    className="input"
                    style={{ paddingLeft: 34 }}
                    placeholder="https://drive.google.com/... or PDF document link"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    disabled={isEvaluated}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              {!isEvaluated && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  {isSubmitted ? (
                    <button
                      type="button"
                      onClick={handleUnsubmit}
                      className="btn btn-secondary"
                      disabled={unsubmitting}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <RotateCcw size={14} />
                      <span>{unsubmitting ? 'Unsubmitting...' : 'Unsubmit to Edit'}</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Send size={14} />
                      <span>{submitting ? 'Submitting...' : 'Turn In Assignment'}</span>
                    </button>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-elevated)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
