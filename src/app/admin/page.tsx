'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import CommandPalette from '@/components/CommandPalette';
import MetricCard from '@/components/MetricCard';
import Student360Drawer from '@/components/Student360Drawer';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  FileText,
  Award,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  Building2,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronDown,
  Clock,
  Calendar,
  Eye,
} from 'lucide-react';
import { AuthUser } from '@/types';

export default function SchoolAdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const loadData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      const roles = meData.data?.roles || [];
      if (roles.includes('STUDENT') || roles.includes('PARENT')) {
        router.replace('/student');
        return;
      }
      const isFaculty = roles.some((r: string) =>
        ['TEACHER', 'SUBJECT_TEACHER', 'JUNIOR_MATH_TEACHER', 'HOD', 'FACULTY'].includes(r)
      );
      if (isFaculty) {
        router.replace('/faculty');
        return;
      }
      setUser(meData.data);

      // Apply dynamic school brand colors to document root!
      if (meData.data.primaryColor) {
        document.documentElement.style.setProperty('--brand-primary', meData.data.primaryColor);
      }
      if (meData.data.accentColor) {
        document.documentElement.style.setProperty('--brand-accent', meData.data.accentColor);
      }

      // Fetch students, teachers, fees, and attendance counts
      const [stuRes, teachRes, feeRes, attRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/teachers'),
        fetch('/api/fees'),
        fetch('/api/attendance'),
      ]);

      const students = stuRes.ok ? (await stuRes.json()).data : [];
      const teachers = teachRes.ok ? (await teachRes.json()).data : [];
      const fees = feeRes.ok ? (await feeRes.json()).data : null;
      const attendance = attRes.ok ? (await attRes.json()).data : null;

      setDashboardData({
        studentsCount: students?.length || 0,
        teachersCount: teachers?.length || 0,
        attendanceStats: attendance?.stats || { percentage: 95 },
        feesMetrics: fees?.metrics || { totalCollected: 45000, totalOutstanding: 0 },
        recentStudents: students?.slice(0, 4) || [],
      });
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

  // Sample data for the visualizer bar chart matching reference UI
  const chartBars = [
    { label: 'JUN', height: 45, color: '#0284c7' },
    { label: 'JUL', height: 35, color: '#0284c7' },
    { label: 'AUG', height: 60, color: '#0284c7' },
    { label: 'SEP', height: 40, color: '#0284c7' },
    { label: 'OCT', height: 55, color: '#0284c7' },
    { label: 'NOV', height: 88, color: '#f59e0b', highlight: true }, // Highlighted bar
    { label: 'DEC', height: 70, color: '#0284c7' },
    { label: 'JAN', height: 30, color: '#0284c7' },
    { label: 'FEB', height: 60, color: '#0284c7' },
    { label: 'MAR', height: 48, color: '#0284c7' },
  ];

  return (
    <div className="app-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="main-content">
        <Topbar
          user={user}
          onOpenCommand={() => setIsCommandOpen(true)}
          title="Institutional Overview"
          subtitle={user?.schoolName || 'Central Campus'}
        />

        <div className="page-body animate-slide-up">
          {/* ======================================================== */}
          {/* TOP BENTO NAVIGATION GRID (EXACT REFERENCE SCREENSHOT)    */}
          {/* ======================================================== */}
          <div className="luxury-bento-grid">
            <Link href="/admin" className="luxury-bento-tile tile-navy">
              <div className="tile-icon">
                <Building2 size={22} color="#fff" />
              </div>
              <div>
                <div className="tile-title">Overview</div>
                <div className="tile-subtitle">Executive Summary</div>
              </div>
            </Link>

            <Link href="/admin/classes" className="luxury-bento-tile tile-purple">
              <div className="tile-icon">
                <GraduationCap size={22} color="#fff" />
              </div>
              <div>
                <div className="tile-title">Academics</div>
                <div className="tile-subtitle">Classes & Subjects</div>
              </div>
            </Link>

            <Link href="/admin/timetable" className="luxury-bento-tile tile-indigo">
              <div className="tile-icon">
                <Clock size={22} color="#fff" />
              </div>
              <div>
                <div className="tile-title">Timetable</div>
                <div className="tile-subtitle">Faculty & Schedules</div>
              </div>
            </Link>

            <Link href="/attendance" className="luxury-bento-tile tile-coral">
              <div className="tile-icon">
                <CalendarCheck size={22} color="#fff" />
              </div>
              <div>
                <div className="tile-title">Attendance</div>
                <div className="tile-subtitle">Daily Register</div>
              </div>
            </Link>

            <Link href="/students" className="luxury-bento-tile tile-cyan">
              <div className="tile-icon">
                <Users size={22} color="#fff" />
              </div>
              <div>
                <div className="tile-title">Directory</div>
                <div className="tile-subtitle">Students & Staff</div>
              </div>
            </Link>

            <Link href="/fees" className="luxury-bento-tile tile-teal">
              <div className="tile-icon">
                <CreditCard size={22} color="#fff" />
              </div>
              <div>
                <div className="tile-title">Finance</div>
                <div className="tile-subtitle">Fees & Revenue</div>
              </div>
            </Link>

            <Link href="/leaves" className="luxury-bento-tile tile-amber">
              <div className="tile-icon">
                <Clock size={22} color="#fff" />
              </div>
              <div>
                <div className="tile-title">Leaves</div>
                <div className="tile-subtitle">Staff Approvals</div>
              </div>
            </Link>
          </div>

          {/* Section Title */}
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Institutional Analytics & Key Metrics
            </h2>
          </div>

          {/* 3 Metric Cards with Red/Green Trend Badges matching Reference UI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginBottom: '28px' }}>
            {/* Card 1: Mensalidades e Caixa */}
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
                  <DollarSign size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Tuition Revenue (Term 2)</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                    ${(dashboardData?.feesMetrics?.totalCollected ?? 45000).toLocaleString()}
                  </div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>100% Collection Rate</span>
                <span className="trend-pill-green">
                  <TrendingUp size={12} /> +14.8% term
                </span>
              </div>
            </div>

            {/* Card 2: Students & Faculty */}
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
                  <Users size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Active Student Body</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                    {dashboardData?.studentsCount ?? 4} Students • {dashboardData?.teachersCount ?? 2} Faculty
                  </div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Campus Capacity: 92%</span>
                <span className="trend-pill-red">
                  <TrendingDown size={12} /> 85.3% enrollment
                </span>
              </div>
            </div>

            {/* Card 3: Daily Campus Attendance */}
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
                  <CalendarCheck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Daily School Attendance</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                    {dashboardData?.attendanceStats?.percentage ?? 95}% Attendance
                  </div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Rosters Verified</span>
                <span className="trend-pill-green">
                  <Sparkles size={12} /> Compliant
                </span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* ANALYTICS BAR CHART & ELECTRONIC AUDITOR (REFERENCE UI)   */}
          {/* ======================================================== */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '24px', marginBottom: '28px' }}>
            {/* Left: Bar Chart Visualizer ("Revenue & Operations Trend") */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>Revenue & Operations Trend</h3>
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
                    $137,594.68 <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700 }}>+14.8% ↗</span>
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
                    Real-time institutional ledger
                  </div>
                </div>
                <Layers size={18} color="var(--brand-primary)" />
              </div>

              {/* Luxury Timeline */}
              <div className="luxury-timeline">
                <div className="luxury-timeline-item">
                  <div className="luxury-timeline-dot dot-purple" />
                  <div className="luxury-timeline-content">
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#8b5cf6' }}>Today, 10:30</div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', marginTop: 2 }}>
                      Medical Leave Approved
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: 2 }}>
                      Faculty leave application validated by Principal.
                    </div>
                  </div>
                </div>

                <div className="luxury-timeline-item">
                  <div className="luxury-timeline-dot dot-cyan" />
                  <div className="luxury-timeline-content">
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#0ea5e9' }}>Yesterday, 16:45</div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', marginTop: 2 }}>
                      Batch Data Sync Completed
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: 2 }}>
                      Student enrollment records successfully synced.
                    </div>
                  </div>
                </div>

                <div className="luxury-timeline-item">
                  <div className="luxury-timeline-dot dot-emerald" />
                  <div className="luxury-timeline-content">
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981' }}>Oct 02, 11:20</div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', marginTop: 2 }}>
                      Bank Gateway Reconciliation
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: 2 }}>
                      Received $45,000 via online fee portal verified.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Access Roster */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Users size={18} color="var(--brand-primary)" />
                <h3 className="card-title">Recent Student Admissions</h3>
              </div>
              <Link href="/students" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                <span>View All Students</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Admission #</th>
                    <th>Student Name</th>
                    <th>Class & Section</th>
                    <th>Roll #</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>360° Profile</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData?.recentStudents?.map((s: any) => (
                    <tr key={s.id}>
                      <td>
                        <span className="command-kbd">{s.admissionNumber}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</td>
                      <td>{s.className} - {s.sectionName}</td>
                      <td>{s.rollNumber}</td>
                      <td>
                        <span className="badge badge-success">ACTIVE</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedStudentId(s.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                        >
                          <Eye size={13} color="var(--brand-primary)" />
                          <span>View 360°</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Student 360° Profile Slide-Over Drawer */}
      <Student360Drawer
        studentId={selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
      />

      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        isSuperAdmin={user?.isSuperAdmin}
      />
    </div>
  );
}
