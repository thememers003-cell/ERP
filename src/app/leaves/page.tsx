'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import CommandPalette from '@/components/CommandPalette';
import Modal from '@/components/Modal';
import {
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Settings,
  Users,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Edit2,
  Check,
  RefreshCw,
} from 'lucide-react';
import { AuthUser } from '@/types';

export default function LeavesPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<'APPLICATIONS' | 'TYPES' | 'QUOTAS'>('APPLICATIONS');
  const [leaves, setLeaves] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [myBalances, setMyBalances] = useState<any[]>([]);
  const [allFacultyBalances, setAllFacultyBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Apply Leave Modal
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [newLeave, setNewLeave] = useState({
    leaveType: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reason: '',
  });

  // Create Custom Leave Type Modal (Admin)
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [creatingType, setCreatingType] = useState(false);
  const [newType, setNewType] = useState({
    name: '',
    code: '',
    defaultDays: 4,
    description: '',
  });

  // Assign Faculty Quota Modal (Admin)
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [savingQuota, setSavingQuota] = useState(false);
  const [selectedQuota, setSelectedQuota] = useState<{
    teacherId: string;
    teacherName: string;
    leaveTypeId: string;
    leaveTypeName: string;
    allocatedDays: number;
  } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      const currentUser: AuthUser = meData.data;
      setUser(currentUser);

      if (currentUser.roles?.includes('STUDENT')) {
        router.replace('/student');
        return;
      }

      const isAdmin =
        currentUser.isSuperAdmin ||
        currentUser.roles.includes('SCHOOL_OWNER') ||
        currentUser.roles.includes('PRINCIPAL') ||
        currentUser.roles.includes('ADMIN');

      // Fetch leaves applications, active leave types, and current user balance
      const [leavesRes, typesRes, balanceRes] = await Promise.all([
        fetch('/api/leaves'),
        fetch('/api/leaves/types'),
        fetch('/api/leaves/balances'),
      ]);

      if (leavesRes.ok) {
        const d = await leavesRes.json();
        setLeaves(d.data || []);
      }

      if (typesRes.ok) {
        const d = await typesRes.json();
        const typesList = d.data || [];
        setLeaveTypes(typesList);
        if (typesList.length > 0 && !newLeave.leaveType) {
          setNewLeave((prev) => ({ ...prev, leaveType: typesList[0].code }));
        }
      }

      if (balanceRes.ok) {
        const d = await balanceRes.json();
        setMyBalances(d.data || []);
      }

      // If Admin, fetch all faculty balances for quota management
      if (isAdmin) {
        const allBalRes = await fetch('/api/leaves/balances?teacherId=ALL');
        if (allBalRes.ok) {
          const d = await allBalRes.json();
          setAllFacultyBalances(d.data || []);
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

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplying(true);
    setApplyError('');
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeave),
      });

      const data = await res.json();
      if (res.ok) {
        setIsApplyOpen(false);
        setNewLeave({
          leaveType: leaveTypes[0]?.code || 'CASUAL',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reason: '',
        });
        await loadData();
      } else {
        setApplyError(data.error?.message || data.error || 'Failed to submit leave request');
      }
    } catch (err: any) {
      setApplyError(err.message || 'Network error occurred');
    } finally {
      setApplying(false);
    }
  };

  const handleCreateLeaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingType(true);
    try {
      const res = await fetch('/api/leaves/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newType),
      });

      if (res.ok) {
        setIsTypeModalOpen(false);
        setNewType({ name: '', code: '', defaultDays: 4, description: '' });
        await loadData();
      } else {
        const errData = await res.json();
        alert(errData.error?.message || 'Failed to create leave type');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating leave type');
    } finally {
      setCreatingType(false);
    }
  };

  const handleSaveFacultyQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuota) return;
    setSavingQuota(true);
    try {
      const res = await fetch('/api/leaves/balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: selectedQuota.teacherId,
          leaveTypeId: selectedQuota.leaveTypeId,
          allocatedDays: selectedQuota.allocatedDays,
        }),
      });

      if (res.ok) {
        setIsQuotaModalOpen(false);
        setSelectedQuota(null);
        await loadData();
      } else {
        const errData = await res.json();
        alert(errData.error?.message || 'Failed to update quota');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating quota');
    } finally {
      setSavingQuota(false);
    }
  };

  const handleUpdateStatus = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/leaves', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveId, status }),
      });

      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isManagement =
    user?.isSuperAdmin ||
    user?.roles?.includes('SCHOOL_OWNER') ||
    user?.roles?.includes('PRINCIPAL') ||
    user?.roles?.includes('ADMIN') ||
    user?.roles?.includes('HOD');

  // Calculate requested days for modal preview
  const getDaysCount = () => {
    const s = new Date(newLeave.startDate);
    const e = new Date(newLeave.endDate);
    const diffTime = e.getTime() - s.getTime();
    if (diffTime < 0) return 0;
    return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // Find remaining balance for the currently selected leave type in apply modal
  const selectedBalance = myBalances.find(
    (b) => b.leaveTypeCode === newLeave.leaveType || b.leaveTypeName === newLeave.leaveType
  );

  return (
    <div className="app-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="main-content">
        <Topbar
          user={user}
          onOpenCommand={() => setIsCommandOpen(true)}
          title="Staff Leaves & Quotas"
          subtitle="Customizable Leave Types, Quota Allocation & Approval Audit"
        />

        <div className="page-body animate-slide-up">
          {/* Header Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                Leave Management & Faculty Quotas
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Configure custom leave types, assign faculty quotas, approve staff absences, and sync directly with the Academic Calendar.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/calendar" className="btn btn-secondary">
                <Calendar size={16} />
                <span>View in Calendar</span>
              </Link>
              {isManagement && (
                <button onClick={() => setIsTypeModalOpen(true)} className="btn btn-secondary">
                  <Settings size={16} />
                  <span>Add Leave Type</span>
                </button>
              )}
              <button onClick={() => setIsApplyOpen(true)} className="btn btn-primary">
                <Plus size={16} />
                <span>Apply for Leave</span>
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* LIVE BALANCE BENTO CARDS (PERSONAL FACULTY BALANCE)      */}
          {/* ======================================================== */}
          {myBalances.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} color="var(--brand-primary)" />
                <span>My Active Leave Balances & Quotas</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                {myBalances.map((bal) => (
                  <div key={bal.id} className="luxury-metric-card" style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span className="badge badge-info" style={{ fontSize: '11px', fontWeight: 700 }}>
                        {bal.leaveTypeName}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Allocated: {bal.allocatedDays}d
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: '24px', fontWeight: 800, color: bal.remainingDays > 0 ? 'var(--text-main)' : '#ef4444' }}>
                        {bal.remainingDays}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>days remaining</span>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 12, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-subtle)' }}>
                      <span>Used: {bal.usedDays} days</span>
                      <span style={{ color: bal.remainingDays > 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                        {bal.remainingDays > 0 ? 'Available' : 'Depleted'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TABS NAVIGATION                                          */}
          {/* ======================================================== */}
          <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-subtle)', marginBottom: 20 }}>
            <button
              onClick={() => setActiveTab('APPLICATIONS')}
              className={`btn btn-sm ${activeTab === 'APPLICATIONS' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
            >
              <Clock size={15} />
              <span>Leave Applications ({leaves.length})</span>
            </button>

            {isManagement && (
              <>
                <button
                  onClick={() => setActiveTab('QUOTAS')}
                  className={`btn btn-sm ${activeTab === 'QUOTAS' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
                >
                  <Users size={15} />
                  <span>Faculty Quota Allocation</span>
                </button>
                <button
                  onClick={() => setActiveTab('TYPES')}
                  className={`btn btn-sm ${activeTab === 'TYPES' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
                >
                  <Settings size={15} />
                  <span>Custom Leave Types ({leaveTypes.length})</span>
                </button>
              </>
            )}
          </div>

          {/* ======================================================== */}
          {/* TAB 1: LEAVE APPLICATIONS TABLE                          */}
          {/* ======================================================== */}
          {activeTab === 'APPLICATIONS' && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Leave History & Review Ledger</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>
                    Approved leaves automatically deduct days from faculty quota and post directly to the Academic Calendar.
                  </div>
                </div>
                <button onClick={loadData} className="btn btn-secondary btn-sm" title="Refresh">
                  <RefreshCw size={14} />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="table-container" style={{ border: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Staff Member</th>
                      <th>Leave Type</th>
                      <th>Duration Dates</th>
                      <th>Days</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                          No leave applications recorded yet. Click "Apply for Leave" above.
                        </td>
                      </tr>
                    ) : (
                      leaves.map((l) => {
                        const startDate = new Date(l.startDate);
                        const endDate = new Date(l.endDate);
                        const daysCount = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                        return (
                          <tr key={l.id}>
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{l.employeeName}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                                {l.employeeCode} • {l.departmentName || 'Faculty'}
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-info" style={{ fontWeight: 700 }}>
                                {l.leaveType}
                              </span>
                            </td>
                            <td style={{ fontSize: '12.5px' }}>
                              {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}
                            </td>
                            <td style={{ fontSize: '12.5px', fontWeight: 700 }}>
                              {daysCount} {daysCount === 1 ? 'day' : 'days'}
                            </td>
                            <td style={{ fontSize: '12.5px', color: 'var(--text-muted)', maxWidth: 220 }}>
                              {l.reason}
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  l.status === 'APPROVED'
                                    ? 'badge-success'
                                    : l.status === 'REJECTED'
                                    ? 'badge-danger'
                                    : 'badge-warning'
                                }`}
                              >
                                {l.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {isManagement && l.status === 'PENDING' ? (
                                <div style={{ display: 'inline-flex', gap: 6 }}>
                                  <button
                                    onClick={() => handleUpdateStatus(l.id, 'APPROVED')}
                                    className="btn btn-sm btn-primary"
                                    title="Approve & Deduct Quota"
                                  >
                                    <CheckCircle2 size={13} />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatus(l.id, 'REJECTED')}
                                    className="btn btn-sm btn-danger"
                                  >
                                    <XCircle size={13} />
                                    <span>Reject</span>
                                  </button>
                                </div>
                              ) : (
                                <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
                                  {l.status === 'APPROVED' ? (
                                    <span style={{ color: '#10b981', fontWeight: 600 }}>Deducted & On Calendar</span>
                                  ) : l.status === 'REJECTED' ? (
                                    <span style={{ color: '#ef4444' }}>Rejected</span>
                                  ) : (
                                    'Submitted'
                                  )}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: FACULTY QUOTA ALLOCATION TABLE (ADMIN)            */}
          {/* ======================================================== */}
          {activeTab === 'QUOTAS' && isManagement && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Faculty Leave Quota Assignment</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>
                    Assign custom quota days per faculty member (e.g. Casual: 4, Paid: 4, Medical: 6). Fully customizable with zero hardcoded limitations.
                  </div>
                </div>
              </div>

              <div className="table-container" style={{ border: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Faculty Member</th>
                      <th>Leave Category</th>
                      <th>Allocated Quota</th>
                      <th>Used Days</th>
                      <th>Remaining Days</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allFacultyBalances.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                          No faculty quotas available. Ensure teachers are registered in the Directory.
                        </td>
                      </tr>
                    ) : (
                      allFacultyBalances.map((b) => (
                        <tr key={b.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{b.teacherName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>Faculty Staff</div>
                          </td>
                          <td>
                            <span className="badge badge-info">{b.leaveTypeName}</span>
                          </td>
                          <td style={{ fontSize: '13px', fontWeight: 800 }}>
                            {b.allocatedDays} days
                          </td>
                          <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            {b.usedDays} days
                          </td>
                          <td>
                            <span
                              className={`badge ${b.remainingDays > 0 ? 'badge-success' : 'badge-danger'}`}
                              style={{ fontWeight: 800 }}
                            >
                              {b.remainingDays} days left
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => {
                                setSelectedQuota({
                                  teacherId: b.teacherId,
                                  teacherName: b.teacherName,
                                  leaveTypeId: b.leaveTypeId,
                                  leaveTypeName: b.leaveTypeName,
                                  allocatedDays: b.allocatedDays,
                                });
                                setIsQuotaModalOpen(true);
                              }}
                              className="btn btn-secondary btn-sm"
                            >
                              <Edit2 size={13} />
                              <span>Assign Quota</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: CUSTOM LEAVE TYPES TABLE (ADMIN)                  */}
          {/* ======================================================== */}
          {activeTab === 'TYPES' && isManagement && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Configured Leave Types</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>
                    Manage institutional leave categories (Regular Leave, Casual Leave, Paid Leave, Medical, Duty, etc.).
                  </div>
                </div>
                <button onClick={() => setIsTypeModalOpen(true)} className="btn btn-primary btn-sm">
                  <Plus size={14} />
                  <span>Add Leave Type</span>
                </button>
              </div>

              <div className="table-container" style={{ border: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Leave Type Name</th>
                      <th>System Code</th>
                      <th>Default Annual Quota</th>
                      <th>Description</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveTypes.map((t) => (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{t.name}</td>
                        <td>
                          <span className="command-kbd">{t.code}</span>
                        </td>
                        <td style={{ fontWeight: 800 }}>{t.defaultDays} days</td>
                        <td style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                          {t.description || 'Standard institutional leave'}
                        </td>
                        <td>
                          <span className="badge badge-success">ACTIVE</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ======================================================== */}
      {/* MODAL 1: APPLY FOR LEAVE                                  */}
      {/* ======================================================== */}
      <Modal isOpen={isApplyOpen} onClose={() => setIsApplyOpen(false)} title="Apply for Absence Leave">
        <form onSubmit={handleApplyLeave}>
          {applyError && (
            <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 8, color: '#ef4444', fontSize: '13px', marginBottom: 14 }}>
              {applyError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Select Leave Type *</label>
            <select
              className="select"
              value={newLeave.leaveType}
              onChange={(e) => setNewLeave({ ...newLeave, leaveType: e.target.value })}
              required
            >
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.code}>
                  {t.name} ({t.defaultDays} default days)
                </option>
              ))}
            </select>
            {selectedBalance && (
              <div style={{ fontSize: '12px', marginTop: 6, color: selectedBalance.remainingDays > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                Remaining Quota Balance: {selectedBalance.remainingDays} of {selectedBalance.allocatedDays} days available
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                className="input"
                value={newLeave.startDate}
                onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input
                type="date"
                className="input"
                value={newLeave.endDate}
                onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 8, marginBottom: 14, fontSize: '12.5px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Calculated Duration:</span>
            <strong style={{ color: 'var(--text-main)' }}>{getDaysCount()} working days</strong>
          </div>

          <div className="form-group">
            <label className="form-label">Reason for Absence *</label>
            <textarea
              className="textarea"
              rows={3}
              placeholder="State the purpose of leave and classroom coverage arrangements..."
              value={newLeave.reason}
              onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
            <button type="button" onClick={() => setIsApplyOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={applying || getDaysCount() <= 0}>
              {applying ? 'Submitting...' : 'Submit Leave Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: CREATE CUSTOM LEAVE TYPE (ADMIN)                */}
      {/* ======================================================== */}
      <Modal isOpen={isTypeModalOpen} onClose={() => setIsTypeModalOpen(false)} title="Create Customizable Leave Type">
        <form onSubmit={handleCreateLeaveType}>
          <div className="form-group">
            <label className="form-label">Leave Type Name *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Regular Leave, Casual Leave, Maternity Leave"
              value={newType.name}
              onChange={(e) => setNewType({ ...newType, name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Unique Code *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. REGULAR, CASUAL, MATERNITY"
                value={newType.code}
                onChange={(e) => setNewType({ ...newType, code: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Default Annual Days *</label>
              <input
                type="number"
                min="1"
                max="365"
                className="input"
                value={newType.defaultDays}
                onChange={(e) => setNewType({ ...newType, defaultDays: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description / Eligibility Policy</label>
            <textarea
              className="textarea"
              rows={2}
              placeholder="Institutional policy guidance on who can apply for this leave..."
              value={newType.description}
              onChange={(e) => setNewType({ ...newType, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
            <button type="button" onClick={() => setIsTypeModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={creatingType}>
              {creatingType ? 'Creating...' : 'Save Leave Type'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 3: ASSIGN FACULTY QUOTA (ADMIN)                    */}
      {/* ======================================================== */}
      {selectedQuota && (
        <Modal isOpen={isQuotaModalOpen} onClose={() => setIsQuotaModalOpen(false)} title="Assign Faculty Quota">
          <form onSubmit={handleSaveFacultyQuota}>
            <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Staff Member</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>
                {selectedQuota.teacherName}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--brand-primary)', fontWeight: 600, marginTop: 4 }}>
                Leave Type: {selectedQuota.leaveTypeName}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Allocated Quota Days *</label>
              <input
                type="number"
                min="0"
                max="365"
                className="input"
                value={selectedQuota.allocatedDays}
                onChange={(e) => setSelectedQuota({ ...selectedQuota, allocatedDays: Number(e.target.value) })}
                required
              />
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: 4 }}>
                Sets the faculty quota for this specific leave category (e.g. Casual 4, Paid 4, Sick 6).
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
              <button type="button" onClick={() => setIsQuotaModalOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={savingQuota}>
                {savingQuota ? 'Saving...' : 'Update Quota'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        isSuperAdmin={user?.isSuperAdmin}
      />
    </div>
  );
}
