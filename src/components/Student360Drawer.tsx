'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Flame,
  Award,
  CalendarCheck,
  CreditCard,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  TrendingUp,
  Download,
  Share2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Clock,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

interface Student360DrawerProps {
  studentId: string | null;
  onClose: () => void;
}

export default function Student360Drawer({ studentId, onClose }: Student360DrawerProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'attendance' | 'academics' | 'financials' | 'contacts'>('attendance');
  const [hoveredDay, setHoveredDay] = useState<any>(null);

  useEffect(() => {
    if (!studentId) return;

    let isMounted = true;
    setLoading(true);

    fetch(`/api/students/${studentId}`)
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
  }, [studentId]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!studentId) return null;

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
            <div style={{ fontSize: '14px', fontWeight: 600 }}>Loading Student 360° Profile...</div>
          </div>
        ) : !data ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <h3>Failed to load student details</h3>
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
                    <span>STUDENT 360° DOSSIER</span>
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
                    title="Export / Print Student Record"
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

              {/* Student Identity Card */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
                <div
                  style={{
                    position: 'relative',
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--brand-primary) 0%, #3b82f6 100%)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 800,
                    boxShadow: 'var(--shadow-glow)',
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
                      {data.admissionNumber}
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
                      {data.class.name} • {data.section.name}
                    </span>
                    <span>•</span>
                    <span>Roll #{data.rollNumber}</span>
                    <span>•</span>
                    <span>Blood: <strong style={{ color: 'var(--brand-primary)' }}>{data.bloodGroup}</strong></span>
                    <span>•</span>
                    <span>AY: {data.academicYear}</span>
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
                {/* Attendance Rate */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-subtle)', fontSize: '11px', fontWeight: 600 }}>
                    <span>ATTENDANCE</span>
                    <CalendarCheck size={13} color="var(--status-success)" />
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>
                    {data.attendance.rate}%
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--status-success)', marginTop: 2 }}>
                    {data.attendance.present}/{data.attendance.totalRecorded} Days Present
                  </div>
                </div>

                {/* Consecutive Streak */}
                <div
                  style={{
                    backgroundColor: 'rgba(249, 115, 22, 0.06)',
                    border: '1px solid rgba(249, 115, 22, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#ea580c', fontSize: '11px', fontWeight: 600 }}>
                    <span>ACTIVE STREAK</span>
                    <Flame size={14} color="#ea580c" />
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#c2410c', marginTop: 4 }}>
                    🔥 {data.attendance.streak} Days
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#ea580c', marginTop: 2 }}>
                    Perfect Punctuality
                  </div>
                </div>

                {/* Academic GPA */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-subtle)', fontSize: '11px', fontWeight: 600 }}>
                    <span>GPA / SCORE</span>
                    <Award size={13} color="var(--brand-primary)" />
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>
                    {data.academics.averageScore}%
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-primary)', marginTop: 2 }}>
                    Rank #{data.academics.rank} of {data.academics.totalStudentsInClass}
                  </div>
                </div>

                {/* Fee Status */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-subtle)', fontSize: '11px', fontWeight: 600 }}>
                    <span>FEE ACCOUNT</span>
                    <CreditCard size={13} color={data.financials.outstandingBalance > 0 ? 'var(--status-danger)' : 'var(--status-success)'} />
                  </div>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      color: data.financials.outstandingBalance > 0 ? 'var(--status-danger)' : 'var(--status-success)',
                      marginTop: 4,
                    }}
                  >
                    ${data.financials.outstandingBalance}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: 2 }}>
                    {data.financials.outstandingBalance === 0 ? 'All Fees Paid' : 'Balance Overdue'}
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
                { id: 'attendance', label: 'Attendance & Streak Strip', icon: Flame },
                { id: 'academics', label: 'Academic Radar & Mastery', icon: Award },
                { id: 'financials', label: 'Fee Invoices', icon: CreditCard },
                { id: 'contacts', label: 'Guardian & Emergency', icon: UserCheck },
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
              {/* TAB 1: ATTENDANCE & STREAK */}
              {activeTab === 'attendance' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Streak Ribbon Banner */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%)',
                      border: '1px solid rgba(234, 88, 12, 0.25)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          backgroundColor: '#ffedd5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '22px',
                        }}
                      >
                        🔥
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#9a3412' }}>
                          Current Unbroken Streak: {data.attendance.streak} Consecutive School Days
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#c2410c', marginTop: 2 }}>
                          Top 5% student punctuality record across {data.class.name}. Eligible for the Monthly Punctuality Badge!
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '4px 10px',
                        backgroundColor: '#ea580c',
                        color: '#fff',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                      }}
                    >
                      EXEMPLARY
                    </span>
                  </div>

                  {/* 30-Day Heatmap Strip */}
                  <div className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div>
                        <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-main)' }}>
                          30-Day Attendance Heat Grid
                        </h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>
                          Hover over any session tile to inspect date and punctuality details
                        </p>
                      </div>

                      {/* Legend */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '11px', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: 'var(--status-success)' }} />
                          <span>Present</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: 'var(--status-warning)' }} />
                          <span>Late</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: 'var(--status-danger)' }} />
                          <span>Absent</span>
                        </div>
                      </div>
                    </div>

                    {/* Heat Strip Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(22px, 1fr))',
                        gap: 6,
                        padding: '12px 0',
                      }}
                    >
                      {data.attendance.history.map((day: any, idx: number) => {
                        const isPresent = day.status === 'PRESENT';
                        const isLate = day.status === 'LATE';
                        const isAbsent = day.status === 'ABSENT';

                        const bgColor = isPresent
                          ? 'var(--status-success)'
                          : isLate
                          ? 'var(--status-warning)'
                          : 'var(--status-danger)';

                        return (
                          <div
                            key={idx}
                            onMouseEnter={() => setHoveredDay(day)}
                            onMouseLeave={() => setHoveredDay(null)}
                            style={{
                              height: 28,
                              borderRadius: 4,
                              backgroundColor: bgColor,
                              opacity: 0.88,
                              cursor: 'pointer',
                              transition: 'transform 0.15s ease, opacity 0.15s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontSize: '10px',
                              fontWeight: 700,
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform = 'scale(1.15)';
                              e.currentTarget.style.opacity = '1';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.opacity = '0.88';
                            }}
                          >
                            {idx + 1}
                          </div>
                        );
                      })}
                    </div>

                    {/* Tooltip display */}
                    <div
                      style={{
                        marginTop: 10,
                        padding: '8px 12px',
                        backgroundColor: 'var(--bg-surface-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        minHeight: 36,
                      }}
                    >
                      {hoveredDay ? (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{hoveredDay.date}</span>
                            <span
                              className={`badge ${
                                hoveredDay.status === 'PRESENT'
                                  ? 'badge-success'
                                  : hoveredDay.status === 'LATE'
                                  ? 'badge-warning'
                                  : 'badge-danger'
                              }`}
                              style={{ padding: '2px 6px', fontSize: '10.5px' }}
                            >
                              {hoveredDay.status}
                            </span>
                          </div>
                          <span style={{ color: 'var(--text-muted)' }}>{hoveredDay.remarks}</span>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                          Hover any day block to inspect check-in timestamp & remarks
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Summary Breakdown Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                    <div className="card" style={{ padding: '14px 16px', borderLeft: '4px solid var(--status-success)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600 }}>PRESENT DAYS</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>
                        {data.attendance.present} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>Sessions</span>
                      </div>
                    </div>
                    <div className="card" style={{ padding: '14px 16px', borderLeft: '4px solid var(--status-warning)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600 }}>LATE ARRIVALS</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>
                        {data.attendance.late} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>Times</span>
                      </div>
                    </div>
                    <div className="card" style={{ padding: '14px 16px', borderLeft: '4px solid var(--status-danger)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600 }}>ABSENT DAYS</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>
                        {data.attendance.absent} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>Unexcused</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ACADEMICS & MASTERY RADAR */}
              {activeTab === 'academics' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-subtle)' }}>OVERALL SCHOLASTIC STATUS</div>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--brand-primary)', marginTop: 2 }}>
                        {data.academics.averageScore}% Aggregate Average
                      </div>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: 4 }}>
                        Standing: Class Rank <strong>#{data.academics.rank}</strong> out of {data.academics.totalStudentsInClass} students (Top 10th Percentile)
                      </p>
                    </div>
                    <div
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'var(--brand-primary-light)',
                        border: '1px solid var(--brand-primary-border)',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--brand-primary)' }}>EQUIVALENT GPA</div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--brand-primary)' }}>
                        {data.academics.gpa} <span style={{ fontSize: '12px', fontWeight: 500 }}>/ 5.0</span>
                      </div>
                    </div>
                  </div>

                  {/* Subject Mastery Radar Progress Bars */}
                  <div className="card" style={{ padding: 20 }}>
                    <h4 style={{ fontSize: '14.5px', fontWeight: 700, marginBottom: 16 }}>
                      Subject Mastery & Assessment Breakdown
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {data.academics.subjectMastery.map((sub: any, idx: number) => {
                        const pct = Math.round((sub.score / sub.max) * 100);
                        const barColor =
                          pct >= 90
                            ? 'var(--status-success)'
                            : pct >= 80
                            ? 'var(--brand-primary)'
                            : pct >= 70
                            ? 'var(--status-warning)'
                            : 'var(--status-danger)';

                        return (
                          <div key={idx}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-main)' }}>
                                  {sub.subject}
                                </span>
                                <span
                                  className="badge"
                                  style={{
                                    backgroundColor: 'var(--bg-surface-subtle)',
                                    color: barColor,
                                    fontWeight: 800,
                                    fontSize: '11px',
                                    padding: '1px 6px',
                                  }}
                                >
                                  {sub.grade}
                                </span>
                              </div>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                                {sub.score} / {sub.max} ({pct}%)
                              </span>
                            </div>

                            {/* Animated Progress Bar */}
                            <div
                              style={{
                                height: 8,
                                width: '100%',
                                backgroundColor: 'var(--bg-surface-subtle)',
                                borderRadius: 4,
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: `${pct}%`,
                                  backgroundColor: barColor,
                                  borderRadius: 4,
                                  transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: FINANCIALS & INVOICES */}
              {activeTab === 'financials' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                    <div className="card" style={{ padding: 16 }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600 }}>TOTAL ASSESSED</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>
                        ${data.financials.totalBilled.toLocaleString()}
                      </div>
                    </div>
                    <div className="card" style={{ padding: 16 }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600 }}>COLLECTED / PAID</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--status-success)', marginTop: 4 }}>
                        ${data.financials.totalPaid.toLocaleString()}
                      </div>
                    </div>
                    <div className="card" style={{ padding: 16 }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600 }}>OUTSTANDING BALANCE</div>
                      <div
                        style={{
                          fontSize: '20px',
                          fontWeight: 800,
                          color: data.financials.outstandingBalance > 0 ? 'var(--status-danger)' : 'var(--status-success)',
                          marginTop: 4,
                        }}
                      >
                        ${data.financials.outstandingBalance.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: 20 }}>
                    <h4 style={{ fontSize: '14.5px', fontWeight: 700, marginBottom: 14 }}>
                      Fee Invoices Ledger
                    </h4>

                    {data.financials.recentInvoices && data.financials.recentInvoices.length > 0 ? (
                      <div className="table-container">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Invoice #</th>
                              <th>Particulars</th>
                              <th>Total</th>
                              <th>Paid</th>
                              <th>Status</th>
                              <th>Due Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.financials.recentInvoices.map((inv: any) => (
                              <tr key={inv.id}>
                                <td style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', fontWeight: 600 }}>
                                  {inv.invoiceNumber}
                                </td>
                                <td>{inv.title}</td>
                                <td style={{ fontWeight: 600 }}>${inv.amount}</td>
                                <td style={{ color: 'var(--status-success)' }}>${inv.paidAmount}</td>
                                <td>
                                  <span
                                    className={`badge ${
                                      inv.status === 'PAID'
                                        ? 'badge-success'
                                        : inv.status === 'PARTIAL'
                                        ? 'badge-warning'
                                        : 'badge-danger'
                                    }`}
                                  >
                                    {inv.status}
                                  </span>
                                </td>
                                <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{inv.dueDate}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                        No invoices billed for this student currently.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: GUARDIAN & CONTACTS */}
              {activeTab === 'contacts' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Guardian Details */}
                  <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          backgroundColor: 'var(--brand-primary-light)',
                          color: 'var(--brand-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <UserCheck size={18} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '14.5px', fontWeight: 700 }}>Primary Guardian</h4>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Relationship: {data.parent.relationship}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '13px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600 }}>FULL NAME</div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: 2 }}>{data.parent.name}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600 }}>OCCUPATION</div>
                        <div style={{ color: 'var(--text-main)', marginTop: 2 }}>{data.parent.occupation}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600 }}>PHONE NUMBER</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <Phone size={13} color="var(--brand-primary)" />
                          <a href={`tel:${data.parent.phone}`} style={{ color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 600 }}>
                            {data.parent.phone}
                          </a>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600 }}>EMAIL ADDRESS</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <Mail size={13} color="var(--brand-primary)" />
                          <a href={`mailto:${data.parent.email}`} style={{ color: 'var(--brand-primary)', textDecoration: 'none' }}>
                            {data.parent.email}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Emergency & Medical Record */}
                  <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          color: 'var(--status-danger)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <HeartPulse size={18} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '14.5px', fontWeight: 700 }}>Emergency & Medical</h4>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Verified Institutional Records</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '13px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600 }}>BLOOD GROUP</div>
                        <div style={{ fontWeight: 700, color: 'var(--status-danger)', marginTop: 2 }}>
                          {data.bloodGroup} (Rh Positive)
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600 }}>EMERGENCY HOTLINE</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <Phone size={13} color="var(--status-danger)" />
                          <a href={`tel:${data.emergencyPhone}`} style={{ color: 'var(--status-danger)', fontWeight: 700, textDecoration: 'none' }}>
                            {data.emergencyPhone}
                          </a>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600 }}>RESIDENTIAL ADDRESS</div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 2, color: 'var(--text-main)' }}>
                          <MapPin size={14} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                          <span>{data.address}</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600 }}>DATE OF BIRTH</div>
                        <div style={{ color: 'var(--text-main)', marginTop: 2 }}>
                          {data.dateOfBirth} (Age 15)
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
                <Clock size={13} />
                <span>Enrolled on {data.admissionDate}</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <a
                  href={`/student/attendance?studentId=${data.id}`}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <CalendarCheck size={14} />
                  <span>Full Attendance Log</span>
                </a>
                <button onClick={onClose} className="btn btn-primary">
                  Done
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
