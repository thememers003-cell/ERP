'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import CommandPalette from '@/components/CommandPalette';
import MetricCard from '@/components/MetricCard';
import Modal from '@/components/Modal';
import ReceiptModal from '@/components/ReceiptModal';
import {
  CreditCard,
  Plus,
  CheckCircle,
  Receipt,
  ArrowDownRight,
  Wallet,
  Download,
  CalendarCheck,
  FileText,
  Award,
  Calendar,
  User,
  Sparkles,
  TrendingUp,
  Search,
  Printer,
  AlertCircle,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  DollarSign,
} from 'lucide-react';
import { AuthUser } from '@/types';
import { exportToExcel } from '@/lib/excel';

export default function FeesAndBillingPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [data, setData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // CRM Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCadence, setSelectedCadence] = useState<'ALL' | 'MONTHLY' | 'TERM_WISE' | 'YEARLY' | 'OVERDUE'>('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');

  // Receipt Modal State
  const [activeReceiptId, setActiveReceiptId] = useState<string | null>(null);

  // Collect Payment Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [payInput, setPayInput] = useState({
    invoiceId: '',
    invoiceTitle: '',
    studentName: '',
    amount: 5000,
    paymentMethod: 'UPI',
    transactionRef: 'UPI-REF-' + Date.now().toString().slice(-6),
  });

  // Create Invoice Modal
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'SINGLE' | 'BULK'>('SINGLE');
  const [generating, setGenerating] = useState(false);
  const [invError, setInvError] = useState('');

  // CRM Student Auto-Suggest
  const [crmSearch, setCrmSearch] = useState('');
  const [selectedStudentForInv, setSelectedStudentForInv] = useState<any | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({
    classId: '',
    title: '',
    category: 'Tuition Fee',
    cadence: 'MONTHLY',
    amount: 4500,
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const isStudent = user?.roles?.includes('STUDENT');
  const isParent = user?.roles?.includes('PARENT');

  const loadData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      setUser(meData.data);

      const [feeRes, stuRes, clsRes] = await Promise.all([
        fetch('/api/fees'),
        fetch('/api/students'),
        fetch('/api/academics/classes'),
      ]);

      if (feeRes.ok) {
        const d = await feeRes.json();
        setData(d.data);
      }
      if (stuRes.ok) {
        const s = await stuRes.json();
        setStudents(s.data || []);
      }
      if (clsRes.ok) {
        const c = await clsRes.json();
        setClasses(c.data || []);
        if (c.data?.length > 0 && !invoiceForm.classId) {
          setInvoiceForm((prev) => ({ ...prev, classId: c.data[0].id }));
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

  // Open Collect Payment
  const openCollectPayment = (inv: any) => {
    setPayInput({
      invoiceId: inv.id,
      invoiceTitle: inv.title,
      studentName: inv.studentName,
      amount: inv.balance || inv.totalAmount,
      paymentMethod: 'UPI',
      transactionRef: 'UPI-REF-' + Date.now().toString().slice(-6),
    });
    setIsPayModalOpen(true);
  };

  // Submit Payment Collection
  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCollecting(true);
    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payInput),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setIsPayModalOpen(false);
        loadData();
        // Immediately trigger the official printable receipt modal!
        setActiveReceiptId(json.data.receipt?.id || json.data.invoice?.id);
      } else {
        alert(json.error?.message || 'Failed to collect payment');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCollecting(false);
    }
  };

  // Submit Generate Invoice
  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setInvError('');

    try {
      const payload: any = {
        title: invoiceForm.title || `${invoiceForm.category} (${invoiceForm.cadence})`,
        amount: invoiceForm.amount,
        dueDate: invoiceForm.dueDate,
        cadence: invoiceForm.cadence,
        category: invoiceForm.category,
      };

      if (invoiceType === 'SINGLE') {
        if (!selectedStudentForInv) {
          throw new Error('Please search and select a student using the CRM search bar');
        }
        payload.studentId = selectedStudentForInv.id;
      } else {
        payload.classId = invoiceForm.classId;
      }

      const res = await fetch('/api/fees/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to generate invoice');
      }

      setIsInvoiceModalOpen(false);
      setSelectedStudentForInv(null);
      setCrmSearch('');
      loadData();
    } catch (err: any) {
      setInvError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  // CRM Search Matches for Modal
  const crmMatches = students.filter((s) => {
    if (!crmSearch.trim()) return false;
    const query = crmSearch.toLowerCase();
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const adm = (s.admissionNumber || '').toLowerCase();
    const roll = (s.rollNumber || '').toLowerCase();
    return fullName.includes(query) || adm.includes(query) || roll.includes(query);
  }).slice(0, 5);

  // Filter Invoices in Main Table
  const invoices = data?.invoices || [];
  const filteredInvoices = invoices.filter((inv: any) => {
    // 1. Cadence filter
    if (selectedCadence === 'OVERDUE') {
      if (inv.status !== 'OVERDUE' && inv.status !== 'PARTIAL' && new Date(inv.dueDate) >= new Date()) {
        return false;
      }
    } else if (selectedCadence !== 'ALL') {
      if (!inv.title.includes(`[${selectedCadence}]`)) {
        return false;
      }
    }

    // 2. Class filter
    if (selectedClassFilter !== 'ALL' && inv.className !== selectedClassFilter) {
      return false;
    }

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const sName = (inv.studentName || '').toLowerCase();
      const adm = (inv.studentAdmNo || '').toLowerCase();
      const invNum = (inv.invoiceNumber || '').toLowerCase();
      const title = (inv.title || '').toLowerCase();
      return sName.includes(q) || adm.includes(q) || invNum.includes(q) || title.includes(q);
    }

    return true;
  });

  return (
    <div className="app-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="main-content">
        <Topbar
          user={user}
          onOpenCommand={() => setIsCommandOpen(true)}
          title={isStudent ? 'My Tuition & Fee Statements' : 'Fee CRM Billing Suite & Official Receipts'}
          subtitle="Accounts receivable, student fee search, cadence billing, and institutional receipts"
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
              <Link href="/exams" className="luxury-bento-tile tile-cyan">
                <div className="tile-icon"><Award size={22} color="#fff" /></div>
                <div><div className="tile-title">Gradebook</div><div className="tile-subtitle">Exam Grades</div></div>
              </Link>
              <Link href="/fees" className="luxury-bento-tile tile-teal" style={{ outline: '3px solid #10b981', outlineOffset: '2px' }}>
                <div className="tile-icon"><CreditCard size={22} color="#fff" /></div>
                <div><div className="tile-title">Finances</div><div className="tile-subtitle">Tuition Statements</div></div>
              </Link>
              <Link href="/calendar" className="luxury-bento-tile tile-amber">
                <div className="tile-icon"><Calendar size={22} color="#fff" /></div>
                <div><div className="tile-title">Calendar</div><div className="tile-subtitle">Schedule</div></div>
              </Link>
            </div>
          )}

          {/* KPI Financial Overview Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <MetricCard
              label="TOTAL ASSESSED / BILLED"
              value={`$${(data?.metrics?.totalBilled || 0).toLocaleString()}`}
              icon={Wallet}
              trend="Institutional gross charges"
            />
            <MetricCard
              label="COLLECTED REVENUE"
              value={`$${(data?.metrics?.totalCollected || 0).toLocaleString()}`}
              icon={CheckCircle}
              trend={`${data?.metrics?.collectionRate || 0}% collection efficiency`}
            />
            <MetricCard
              label="OUTSTANDING DUES"
              value={`$${(data?.metrics?.totalOutstanding || 0).toLocaleString()}`}
              icon={CreditCard}
              trend="Pending student balances"
            />
            <MetricCard
              label="RECOVERY EFFICIENCY"
              value={`${data?.metrics?.collectionRate || 0}%`}
              icon={TrendingUp}
              trend="Target: 95% minimum"
            />
          </div>

          {/* CRM Search & Action Bar */}
          <div className="card" style={{ padding: '18px 22px', marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              {/* Live Search Input */}
              <div style={{ position: 'relative', flex: 1, minWidth: '280px', maxWidth: '540px' }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: 11, color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="CRM Search by Student Name, Admission #, Roll #, or Invoice #..."
                  className="input"
                  style={{ paddingLeft: 38 }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Class Filter Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <select
                  className="select"
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  style={{ width: 'auto', padding: '8px 14px', fontSize: '13px' }}
                >
                  <option value="ALL">All Classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>

                {!isStudent && !isParent && (
                  <button
                    onClick={() => {
                      setSelectedStudentForInv(null);
                      setCrmSearch('');
                      setIsInvoiceModalOpen(true);
                    }}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Plus size={16} />
                    <span>Issue Fee Invoice</span>
                  </button>
                )}
              </div>
            </div>

            {/* Cadence Tabs */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginTop: 16,
                paddingTop: 14,
                borderTop: '1px solid var(--border-subtle)',
                flexWrap: 'wrap',
              }}
            >
              {[
                { id: 'ALL', label: `All Invoices (${invoices.length})` },
                { id: 'MONTHLY', label: '📅 Monthly Tuition' },
                { id: 'TERM_WISE', label: '🎓 Term-Wise Fees' },
                { id: 'YEARLY', label: '🏛️ Annual Dues' },
                { id: 'OVERDUE', label: '⚠️ Overdue & Pending' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCadence(tab.id as any)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '12.5px',
                    fontWeight: selectedCadence === tab.id ? 700 : 500,
                    backgroundColor: selectedCadence === tab.id ? 'var(--brand-primary)' : 'var(--bg-surface)',
                    color: selectedCadence === tab.id ? '#fff' : 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Invoices Ledger Table */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="card-title">Fee Ledger & Accounts ({filteredInvoices.length})</h3>
                <p className="card-subtitle">Real-time balances, payments, and downloadable receipt vouchers</p>
              </div>
              <button
                onClick={() => exportToExcel(filteredInvoices, 'Fee_Statements_Ledger')}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Download size={14} />
                <span>Export Ledger (Excel)</span>
              </button>
            </div>

            <div className="table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Student Details</th>
                    <th>Fee Particulars</th>
                    <th>Assessed</th>
                    <th>Paid</th>
                    <th>Balance Due</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv: any) => {
                    const isFullyPaid = inv.balance === 0 || inv.status === 'PAID';
                    const isOverdue = !isFullyPaid && new Date(inv.dueDate) < new Date();

                    return (
                      <tr key={inv.id}>
                        <td>
                          <span className="command-kbd">{inv.invoiceNumber}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{inv.studentName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                            Adm: {inv.studentAdmNo} • {inv.className}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{inv.title}</div>
                        </td>
                        <td style={{ fontWeight: 600 }}>${inv.totalAmount.toLocaleString()}</td>
                        <td style={{ color: 'var(--status-success)', fontWeight: 600 }}>
                          ${inv.paidAmount.toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 700, color: inv.balance > 0 ? 'var(--status-danger)' : 'var(--status-success)' }}>
                          ${inv.balance.toLocaleString()}
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {new Date(inv.dueDate).toLocaleDateString()}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              isFullyPaid
                                ? 'badge-success'
                                : isOverdue
                                ? 'badge-danger'
                                : 'badge-warning'
                            }`}
                            style={{ fontWeight: 800, fontSize: '11px' }}
                          >
                            {isFullyPaid ? 'PAID' : isOverdue ? 'OVERDUE' : 'PARTIAL'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6, justifyContent: 'flex-end' }}>
                            {/* Official Receipt Button */}
                            <button
                              onClick={() => setActiveReceiptId(inv.id)}
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '12px' }}
                              title="Print Official Payment Receipt Voucher"
                            >
                              <Printer size={13} color="var(--brand-primary)" />
                              <span>Receipt</span>
                            </button>

                            {/* Collect Payment (for Admins) or Pay Now */}
                            {!isFullyPaid && (
                              <button
                                onClick={() => openCollectPayment(inv)}
                                className="btn btn-primary btn-sm"
                                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '12px' }}
                              >
                                <DollarSign size={13} />
                                <span>{isStudent ? 'Pay Due' : 'Collect'}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredInvoices.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No invoices found matching your search and cadence filter.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ======================================================== */}
      {/* GENERATE FEE INVOICE MODAL (WITH CRM STUDENT AUTO-IMPORT) */}
      {/* ======================================================== */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Issue Institutional Fee Invoice"
        maxWidth="680px"
      >
        <form onSubmit={handleGenerateInvoice}>
          {invError && (
            <div style={{ padding: '10px 14px', backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)', borderRadius: 6, fontSize: '13px', marginBottom: 16 }}>
              {invError}
            </div>
          )}

          {/* Toggle Single Student vs Bulk Class */}
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
              onClick={() => setInvoiceType('SINGLE')}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: invoiceType === 'SINGLE' ? 700 : 500,
                backgroundColor: invoiceType === 'SINGLE' ? 'var(--brand-primary)' : 'transparent',
                color: invoiceType === 'SINGLE' ? '#fff' : 'var(--text-muted)',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              👤 Individual Student (CRM Search)
            </button>
            <button
              type="button"
              onClick={() => setInvoiceType('BULK')}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: invoiceType === 'BULK' ? 700 : 500,
                backgroundColor: invoiceType === 'BULK' ? 'var(--brand-primary)' : 'transparent',
                color: invoiceType === 'BULK' ? '#fff' : 'var(--text-muted)',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              👥 Bulk Issue to Entire Class Grade
            </button>
          </div>

          {/* Student CRM Search (Single Mode) */}
          {invoiceType === 'SINGLE' ? (
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Search & Auto-Import Student *</label>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Type student name, admission #, or roll number..."
                  className="input"
                  style={{ paddingLeft: 34 }}
                  value={crmSearch}
                  onChange={(e) => {
                    setCrmSearch(e.target.value);
                    if (selectedStudentForInv) setSelectedStudentForInv(null);
                  }}
                />
              </div>

              {/* Suggestions Dropdown */}
              {crmMatches.length > 0 && !selectedStudentForInv && (
                <div
                  style={{
                    marginTop: 6,
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface)',
                    boxShadow: 'var(--shadow-md)',
                    overflow: 'hidden',
                  }}
                >
                  {crmMatches.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedStudentForInv(s);
                        setCrmSearch(`${s.firstName} ${s.lastName} (${s.admissionNumber})`);
                      }}
                      style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '13px',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-subtle)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div>
                        <strong>{s.firstName} {s.lastName}</strong>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>Class: {s.className} - {s.sectionName}</span>
                      </div>
                      <span className="command-kbd">{s.admissionNumber}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Student Confirmation Pill */}
              {selectedStudentForInv && (
                <div
                  style={{
                    marginTop: 10,
                    padding: '10px 14px',
                    backgroundColor: 'var(--brand-primary-light)',
                    border: '1px solid var(--brand-primary-border)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ fontSize: '13px' }}>
                    Auto-imported: <strong>{selectedStudentForInv.firstName} {selectedStudentForInv.lastName}</strong> ({selectedStudentForInv.admissionNumber}) • {selectedStudentForInv.className}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudentForInv(null);
                      setCrmSearch('');
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Change
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Bulk Class Selector */
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Target Class Grade *</label>
              <select
                className="select"
                value={invoiceForm.classId}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, classId: e.target.value })}
                required
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.sections?.length || 1} Sections)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Billing Cadence Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Billing Frequency / Cadence *</label>
              <select
                className="select"
                value={invoiceForm.cadence}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, cadence: e.target.value })}
              >
                <option value="MONTHLY">Monthly Tuition</option>
                <option value="TERM_WISE">Term-Wise Academic Fee</option>
                <option value="YEARLY">Yearly / Annual Dues</option>
                <option value="ONE_TIME">One-Time / Miscellaneous</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Fee Category</label>
              <select
                className="select"
                value={invoiceForm.category}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, category: e.target.value })}
              >
                <option value="Tuition Fee">Tuition Fee</option>
                <option value="Laboratory & Science Fee">Laboratory & Science Fee</option>
                <option value="Transport & Bus Fee">Transport & Bus Fee</option>
                <option value="Sports & Library Fee">Sports & Library Fee</option>
                <option value="Annual Development Dues">Annual Development Dues</option>
              </select>
            </div>
          </div>

          {/* Title & Amount */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Invoice Title (Optional override)</label>
              <input
                type="text"
                className="input"
                placeholder={`e.g. ${invoiceForm.category} - Term 1`}
                value={invoiceForm.title}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Amount ($) *</label>
              <input
                type="number"
                min="1"
                step="50"
                className="input"
                value={invoiceForm.amount}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Payment Due Date *</label>
            <input
              type="date"
              className="input"
              value={invoiceForm.dueDate}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" onClick={() => setIsInvoiceModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={generating}>
              {generating ? 'Generating Invoices...' : invoiceType === 'SINGLE' ? 'Generate Student Invoice' : 'Bulk Issue to Class'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* COLLECT PAYMENT MODAL */}
      {/* ======================================================== */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={`Collect Fee Payment: ${payInput.studentName}`}
        maxWidth="500px"
      >
        <form onSubmit={handleCollectPayment}>
          <div style={{ marginBottom: 16, padding: '12px 14px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>PAYMENT FOR:</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginTop: 2 }}>{payInput.invoiceTitle}</div>
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Payment Amount ($) *</label>
            <input
              type="number"
              min="1"
              className="input"
              value={payInput.amount}
              onChange={(e) => setPayInput({ ...payInput, amount: Number(e.target.value) })}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Payment Mode *</label>
            <select
              className="select"
              value={payInput.paymentMethod}
              onChange={(e) => setPayInput({ ...payInput, paymentMethod: e.target.value })}
            >
              <option value="UPI">UPI / Digital QR</option>
              <option value="CARD">Credit / Debit Card</option>
              <option value="BANK_TRANSFER">Bank Direct Wire</option>
              <option value="CASH">Cash Deposit</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Transaction / Bank Reference</label>
            <input
              type="text"
              className="input"
              value={payInput.transactionRef}
              onChange={(e) => setPayInput({ ...payInput, transactionRef: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" onClick={() => setIsPayModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={collecting}>
              {collecting ? 'Processing Payment...' : 'Collect & Print Receipt'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Official Printable Receipt Modal */}
      <ReceiptModal
        receiptId={activeReceiptId}
        onClose={() => setActiveReceiptId(null)}
      />

      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        isSuperAdmin={user?.isSuperAdmin}
      />
    </div>
  );
}
