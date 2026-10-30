'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  BookOpen,
  CalendarCheck,
  Building2,
  Phone,
  Mail,
  Clock,
  Briefcase,
  Star,
  CheckCircle2,
  Calendar,
  Sparkles,
  Download,
  Users,
  Layers,
  HeartPulse,
} from 'lucide-react';

interface Faculty360DrawerProps {
  teacherId: string | null;
  onClose: () => void;
}

export default function Faculty360Drawer({ teacherId, onClose }: Faculty360DrawerProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'workload' | 'leaves' | 'qualifications'>('workload');

  useEffect(() => {
    if (!teacherId) return;

    let isMounted = true;
    setLoading(true);

    fetch(`/api/teachers/${teacherId}`)
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.success) {
          setData(json.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [teacherId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!teacherId) return null;

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
          maxWidth: '780px',
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
        {loading ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              color: 'var(--text-muted)',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                border: '3px solid var(--brand-primary-light)',
                borderTopColor: 'var(--brand-primary)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <div style={{ fontSize: '14px', fontWeight: 600 }}>Loading Faculty 360° Profile...</div>
          </div>
        ) : !data ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <h3>Failed to load faculty details</h3>
            <button onClick={onClose} className="btn btn-secondary" style={{ marginTop: 16 }}>
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Header section with gradient accent */}
            <div
              style={{
                padding: '24px 28px 18px',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'linear-gradient(180deg, var(--bg-surface-subtle) 0%, var(--bg-surface) 100%)',
                position: 'relative',
              }}
            >
              {/* Close Button & Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    className="badge badge-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px' }}
                  >
                    <Sparkles size={12} />
                    <span>FACULTY 360° DOSSIER</span>
                  </span>
                  <span className="badge badge-success" style={{ padding: '3px 8px' }}>
                    {data.status}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => window.print()}
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                  >
                    <Download size={13} />
                    <span>Print Dossier</span>
                  </button>
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
                    title="Close (Esc)"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Faculty Identity Card */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
                <div
                  style={{
                    position: 'relative',
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 800,
                    boxShadow: '0 0 25px -5px rgba(5, 150, 105, 0.3)',
                    flexShrink: 0,
                  }}
                >
                  {data.firstName[0]}
                  {data.lastName[0]}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: 'var(--status-success)',
                      border: '2px solid var(--bg-surface)',
                    }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                    <h2
                      style={{
                        fontSize: '22px',
                        fontWeight: 800,
                        color: 'var(--text-main)',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {data.firstName} {data.lastName}
                    </h2>
                    <span
                      style={{
                        fontSize: '12px',
                        fontFamily: 'JetBrains Mono, monospace',
                        padding: '2px 8px',
                        borderRadius: 4,
                        backgroundColor: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {data.employeeCode}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginTop: 6,
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {data.designation}
                    </span>
                    <span>•</span>
                    <span className="badge badge-info">{data.department.name}</span>
                    <span>•</span>
                    <span>{data.qualification}</span>
                  </div>
                </div>
              </div>

              {/* 4 Quick Stat Metric Tiles */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 12,
                  marginTop: 18,
                }}
              >
                {/* Teaching Load */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-subtle)', fontSize: '11px', fontWeight: 600 }}>
                    <span>TEACHING LOAD</span>
                    <Clock size={13} color="var(--brand-primary)" />
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>
                    {data.workload.periodsPerWeek} <span style={{ fontSize: '12px', fontWeight: 500 }}>Slots/Wk</span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-primary)', marginTop: 2 }}>
                    ~{data.workload.teachingHoursPerWeek} Hours/Week
                  </div>
                </div>

                {/* Student Reach */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-subtle)', fontSize: '11px', fontWeight: 600 }}>
                    <span>STUDENT REACH</span>
                    <Users size={13} color="#059669" />
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669', marginTop: 4 }}>
                    {data.workload.approximateStudentsReached}+
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: 2 }}>
                    Across {data.workload.totalClassesAssigned} Classes
                  </div>
                </div>

                {/* Leave Balance */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-subtle)', fontSize: '11px', fontWeight: 600 }}>
                    <span>LEAVE BALANCE</span>
                    <CalendarCheck size={13} color="var(--status-warning)" />
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>
                    {data.leaves.casual.remaining + data.leaves.sick.remaining} Days
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--status-warning)', marginTop: 2 }}>
                    {data.leaves.casual.remaining} Casual • {data.leaves.sick.remaining} Sick
                  </div>
                </div>

                {/* Student Rating */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-subtle)', fontSize: '11px', fontWeight: 600 }}>
                    <span>STUDENT RATING</span>
                    <Star size={13} color="#f59e0b" fill="#f59e0b" />
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#d97706', marginTop: 4 }}>
                    ★ {data.performance.rating}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--status-success)', marginTop: 2 }}>
                    98% Punctual
                  </div>
                </div>
              </div>
            </div>

            {/* Tab navigation */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                padding: '0 28px',
                borderBottom: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              {[
                { id: 'workload', label: 'Teaching Assignments & Load', icon: BookOpen },
                { id: 'leaves', label: 'Leave Balances & History', icon: CalendarCheck },
                { id: 'qualifications', label: 'Credentials & Profile', icon: Award },
              ].map((tab) => {
                const Icon = tab.icon;
                const isCurrent = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '12px 14px',
                      fontSize: '13px',
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? 'var(--brand-primary)' : 'var(--text-muted)',
                      borderBottom: isCurrent ? '2px solid var(--brand-primary)' : '2px solid transparent',
                      background: 'none',
                      borderTop: 'none',
                      borderLeft: 'none',
                      borderRight: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={14} color={isCurrent ? 'var(--brand-primary)' : 'var(--text-subtle)'} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
              {/* TAB 1: WORKLOAD & ASSIGNMENTS */}
              {activeTab === 'workload' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Class Teacher Responsibility Card */}
                  {data.classTeacherOf && data.classTeacherOf.length > 0 && (
                    <div
                      style={{
                        padding: '16px 20px',
                        backgroundColor: 'var(--brand-primary-light)',
                        border: '1px solid var(--brand-primary-border)',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--brand-primary)' }}>
                          OFFICIAL CLASS TEACHER APPOINTMENT
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>
                          {data.classTeacherOf.map((ct: any) => `${ct.className} - ${ct.sectionName}`).join(', ')}
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: 2 }}>
                          Supervising {data.classTeacherOf.reduce((s: number, c: any) => s + (c.studentCount || 30), 0)} students
                        </div>
                      </div>
                      <span className="badge badge-primary">ACTIVE SUPERVISOR</span>
                    </div>
                  )}

                  {/* Assigned Subjects Matrix */}
                  <div className="card" style={{ padding: 20 }}>
                    <h4 style={{ fontSize: '14.5px', fontWeight: 700, marginBottom: 14 }}>
                      Curriculum Subject Allocations
                    </h4>

                    {data.subjectsTaught && data.subjectsTaught.length > 0 ? (
                      <div className="table-container">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Subject</th>
                              <th>Code</th>
                              <th>Class Grade</th>
                              <th>Section</th>
                              <th>Weekly Periods</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.subjectsTaught.map((st: any) => (
                              <tr key={st.id}>
                                <td style={{ fontWeight: 600 }}>{st.subjectName}</td>
                                <td style={{ fontFamily: 'JetBrains Mono', fontSize: '12px' }}>{st.subjectCode}</td>
                                <td>{st.className}</td>
                                <td>{st.sectionName}</td>
                                <td>
                                  <span className="badge badge-info">5 Periods/Wk</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                        No curriculum subjects currently allocated.
                      </div>
                    )}
                  </div>

                  {/* Syllabus & Performance Card */}
                  <div className="card" style={{ padding: 20 }}>
                    <h4 style={{ fontSize: '14.5px', fontWeight: 700, marginBottom: 12 }}>
                      Academic Performance & Appraisal
                    </h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      {data.performance.evaluationRemarks}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16 }}>
                      <div style={{ padding: 12, backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600 }}>SYLLABUS COVERAGE</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--status-success)', marginTop: 2 }}>
                          {data.performance.syllabusCompletionRate}% Complete
                        </div>
                      </div>
                      <div style={{ padding: 12, backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600 }}>STUDENT SATISFACTION</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--brand-primary)', marginTop: 2 }}>
                          {data.performance.rating} / 5.0 (Exceptional)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: LEAVES */}
              {activeTab === 'leaves' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                    <div className="card" style={{ padding: 16 }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600 }}>CASUAL LEAVES</div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>
                        {data.leaves.casual.remaining} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>/ {data.leaves.casual.total} left</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
                        {data.leaves.casual.used} Days Consumed
                      </div>
                    </div>

                    <div className="card" style={{ padding: 16 }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600 }}>MEDICAL / SICK LEAVES</div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>
                        {data.leaves.sick.remaining} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>/ {data.leaves.sick.total} left</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
                        {data.leaves.sick.used} Days Consumed
                      </div>
                    </div>

                    <div className="card" style={{ padding: 16 }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600 }}>PAID ANNUAL LEAVES</div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>
                        {data.leaves.paid.remaining} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>/ {data.leaves.paid.total} left</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
                        {data.leaves.paid.used} Days Consumed
                      </div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: 20 }}>
                    <h4 style={{ fontSize: '14.5px', fontWeight: 700, marginBottom: 14 }}>
                      Recent Leave Applications
                    </h4>

                    {data.leaves.recentHistory && data.leaves.recentHistory.length > 0 ? (
                      <div className="table-container">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Type</th>
                              <th>Dates</th>
                              <th>Reason</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.leaves.recentHistory.map((l: any) => (
                              <tr key={l.id}>
                                <td style={{ fontWeight: 600 }}>{l.type}</td>
                                <td>{l.startDate} to {l.endDate}</td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{l.reason || 'Personal'}</td>
                                <td>
                                  <span
                                    className={`badge ${
                                      l.status === 'APPROVED'
                                        ? 'badge-success'
                                        : l.status === 'PENDING'
                                        ? 'badge-warning'
                                        : 'badge-danger'
                                    }`}
                                  >
                                    {l.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                        No leave applications filed in this academic term.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: QUALIFICATIONS & PROFILE */}
              {activeTab === 'qualifications' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="card" style={{ padding: 20 }}>
                    <h4 style={{ fontSize: '14.5px', fontWeight: 700, marginBottom: 16 }}>
                      Professional Credentials
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '13px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600 }}>QUALIFICATION</div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: 2 }}>{data.qualification}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600 }}>DEPARTMENT</div>
                        <div style={{ color: 'var(--text-main)', marginTop: 2 }}>{data.department.name} ({data.department.code})</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600 }}>DATE OF JOINING</div>
                        <div style={{ color: 'var(--text-main)', marginTop: 2 }}>{data.joiningDate}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600 }}>ROLES & PRIVILEGES</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                          {data.roles.map((r: string, idx: number) => (
                            <span key={idx} className="badge badge-info">{r}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: 20 }}>
                    <h4 style={{ fontSize: '14.5px', fontWeight: 700, marginBottom: 16 }}>
                      Direct Communication
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '13px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600 }}>OFFICIAL EMAIL</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <Mail size={13} color="var(--brand-primary)" />
                          <a href={`mailto:${data.email}`} style={{ color: 'var(--brand-primary)', textDecoration: 'none' }}>
                            {data.email}
                          </a>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600 }}>PHONE NUMBER</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <Phone size={13} color="var(--brand-primary)" />
                          <a href={`tel:${data.phone}`} style={{ color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 600 }}>
                            {data.phone}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Footer Actions */}
            <div
              style={{
                padding: '16px 28px',
                borderTop: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface-elevated)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={13} color="var(--status-success)" />
                <span>Verified Faculty Staff</span>
              </div>
              <button onClick={onClose} className="btn btn-primary">
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
