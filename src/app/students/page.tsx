'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import CommandPalette from '@/components/CommandPalette';
import Modal from '@/components/Modal';
import Student360Drawer from '@/components/Student360Drawer';
import { Users, Plus, Search, Filter, Download, Upload, Eye, Phone, Mail, FileSpreadsheet, CheckCircle2, CalendarCheck, ArrowDownAZ, KeyRound, Copy } from 'lucide-react';
import { AuthUser } from '@/types';
import { exportToExcel, exportToCSV, parseExcelOrCSV, downloadStudentImportTemplate } from '@/lib/excel';

export default function StudentsDirectoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');

  // Auto Roll Modal
  const [isAutoRollOpen, setIsAutoRollOpen] = useState(false);
  const [autoRollClassId, setAutoRollClassId] = useState('');
  const [autoRollSectionId, setAutoRollSectionId] = useState('');
  const [autoRollLoading, setAutoRollLoading] = useState(false);
  const [autoRollMessage, setAutoRollMessage] = useState('');
  const [autoRollSuccess, setAutoRollSuccess] = useState(false);

  // Bulk Credentials Modal
  const [isBulkCredsOpen, setIsBulkCredsOpen] = useState(false);
  const [bulkCredsClassId, setBulkCredsClassId] = useState('ALL');
  const [bulkCredsSectionId, setBulkCredsSectionId] = useState('ALL');
  const [bulkDomain, setBulkDomain] = useState('school.edu');
  const [emailPattern, setEmailPattern] = useState<'name' | 'admission' | 'roll_class'>('name');
  const [passwordMode, setPasswordMode] = useState<'default' | 'admission'>('default');
  const [defaultPassword, setDefaultPassword] = useState('Student@123');
  const [bulkCredsLoading, setBulkCredsLoading] = useState(false);
  const [bulkCredsMessage, setBulkCredsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [bulkCredsResults, setBulkCredsResults] = useState<any[] | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Enroll Student Modal
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [formError, setFormError] = useState('');
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    email: '',
    admissionNumber: '',
    rollNumber: '',
    classId: '',
    sectionId: '',
    gender: 'MALE',
    bloodGroup: 'O+',
  });

  // Import Excel Modal
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<any>(null);

  // Student 360 Profile Drawer/Modal
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

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

      const [stuRes, clsRes] = await Promise.all([
        fetch(`/api/students?search=${encodeURIComponent(search)}&classId=${selectedClass}`),
        fetch('/api/academics/classes'),
      ]);

      if (stuRes.ok) setStudents((await stuRes.json()).data);
      if (clsRes.ok) {
        const cList = (await clsRes.json()).data;
        setClasses(cList);
        if (cList.length > 0 && !newStudent.classId) {
          setNewStudent((prev) => ({
            ...prev,
            classId: cList[0].id,
            sectionId: cList[0].sections[0]?.id || '',
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
  }, [search, selectedClass]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrolling(true);
    setFormError('');

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error?.message || 'Failed to enroll student');

      setIsEnrollOpen(false);
      setNewStudent({
        firstName: '',
        lastName: '',
        email: '',
        admissionNumber: '',
        rollNumber: '',
        classId: classes[0]?.id || '',
        sectionId: classes[0]?.sections[0]?.id || '',
        gender: 'MALE',
        bloodGroup: 'O+',
      });
      loadData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setEnrolling(false);
    }
  };

  const handleAutoSequenceRoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!autoRollClassId) return;
    setAutoRollLoading(true);
    setAutoRollMessage('');
    setAutoRollSuccess(false);

    try {
      const res = await fetch('/api/students/auto-roll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: autoRollClassId,
          sectionId: autoRollSectionId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to auto-sequence roll numbers');

      setAutoRollSuccess(true);
      setAutoRollMessage(data.message || 'Roll numbers updated successfully!');
      loadData();
    } catch (err: any) {
      setAutoRollMessage(err.message);
    } finally {
      setAutoRollLoading(false);
    }
  };

  const handleBulkAssignCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkCredsLoading(true);
    setBulkCredsMessage(null);
    try {
      const res = await fetch('/api/students/bulk-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: bulkCredsClassId,
          sectionId: bulkCredsSectionId,
          domain: bulkDomain,
          emailPattern,
          passwordMode,
          defaultPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to bulk-assign student credentials');

      setBulkCredsResults(data.data.credentials || []);
      setBulkCredsMessage({
        type: 'success',
        text: `Successfully generated and assigned login emails & passwords for ${data.data.count} students!`,
      });
      loadData();
    } catch (err: any) {
      setBulkCredsMessage({ type: 'error', text: err.message });
    } finally {
      setBulkCredsLoading(false);
    }
  };

  const handleDownloadCredentialsExcel = () => {
    if (!bulkCredsResults || bulkCredsResults.length === 0) return;
    const exportRows = bulkCredsResults.map((r) => ({
      'Student Name': r.name,
      'Admission Number': r.admissionNumber,
      'Roll Number': r.rollNumber,
      'Class': r.className,
      'Section': r.sectionName,
      'Assigned Email': r.email,
      'Login Password': r.temporaryPassword,
    }));
    exportToExcel(exportRows, `Student_Login_Credentials_${new Date().toISOString().split('T')[0]}`);
  };

  // Excel / CSV Export
  const handleExportExcel = () => {
    const exportData = students.map((s) => ({
      'Admission Number': s.admissionNumber,
      'First Name': s.firstName,
      'Last Name': s.lastName,
      'Email': s.email,
      'Class': s.className,
      'Section': s.sectionName,
      'Roll Number': s.rollNumber,
      'Gender': s.gender,
      'Blood Group': s.bloodGroup,
      'Parent Name': s.parentName,
      'Parent Phone': s.parentPhone,
      'Status': s.status,
    }));
    exportToExcel(exportData, `Students_Directory_${new Date().toISOString().split('T')[0]}`);
  };

  // Excel / CSV File Picked
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows = await parseExcelOrCSV(file);
      setImportRows(rows);
      setImportResult(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Execute Bulk Import
  const handleSaveImport = async () => {
    if (importRows.length === 0) return;
    setImporting(true);

    try {
      const res = await fetch('/api/import/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: importRows }),
      });

      const d = await res.json();
      if (res.ok) {
        setImportResult(d.data);
        loadData(); // Real-time refresh of students list!
      }
    } catch (err) {
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  const activeClassSections = classes.find((c) => c.id === newStudent.classId)?.sections || [];

  return (
    <div className="app-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="main-content">
        <Topbar
          user={user}
          onOpenCommand={() => setIsCommandOpen(true)}
          title="Student Information System"
          subtitle="Learners Directory & 360° Records"
        />

        <div className="page-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Student Directory ({students.length})
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Comprehensive student lifecycle records, parental links, and academic standing.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={handleExportExcel} className="btn btn-secondary" title="Export to Microsoft Excel">
                <Download size={15} />
                <span>Export Excel</span>
              </button>
              <button onClick={() => { setIsImportOpen(true); setImportRows([]); setImportResult(null); }} className="btn btn-secondary">
                <Upload size={15} />
                <span>Import Excel / CSV</span>
              </button>
              <button
                onClick={() => {
                  setAutoRollClassId(classes[0]?.id || '');
                  setAutoRollSectionId('ALL');
                  setAutoRollMessage('');
                  setAutoRollSuccess(false);
                  setIsAutoRollOpen(true);
                }}
                className="btn btn-secondary"
                title="Auto-sequence student roll numbers alphabetically (01, 02, 03...)"
              >
                <ArrowDownAZ size={15} />
                <span>Auto-Roll #</span>
              </button>
              <button
                onClick={() => {
                  setBulkCredsClassId('ALL');
                  setBulkCredsSectionId('ALL');
                  setBulkCredsMessage(null);
                  setBulkCredsResults(null);
                  setIsBulkCredsOpen(true);
                }}
                className="btn btn-secondary"
                title="Assign institutional emails & passwords to students in bulk"
              >
                <KeyRound size={15} />
                <span>Assign Mails & Passwords</span>
              </button>
              <button onClick={() => setIsEnrollOpen(true)} className="btn btn-primary">
                <Plus size={16} />
                <span>Enroll Student</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
                <Search size={18} color="var(--text-subtle)" />
                <input
                  type="text"
                  placeholder="Search by student name, roll number, admission #..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input"
                  style={{ border: 'none', backgroundColor: 'transparent', padding: '6px 0' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Class:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="select"
                  style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
                >
                  <option value="ALL">All Classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Admission #</th>
                  <th>Student Name</th>
                  <th>Class & Section</th>
                  <th>Roll #</th>
                  <th>Parent / Guardian</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>360° Profile</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td><span className="command-kbd">{s.admissionNumber}</span></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>{s.email}</div>
                    </td>
                    <td>{s.className} - {s.sectionName}</td>
                    <td><strong>{s.rollNumber}</strong></td>
                    <td>{s.parentName}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.parentPhone}</td>
                    <td><span className="badge badge-success">{s.status}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedStudent(s)}
                        className="btn btn-secondary btn-sm"
                      >
                        <Eye size={13} />
                        <span>View 360°</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Import Excel / CSV Modal */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Students via Excel / CSV"
        maxWidth="800px"
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Upload a spreadsheet (<strong>.xlsx</strong> or <strong>.csv</strong>) containing student rosters.
            </p>
            <button
              type="button"
              onClick={() => downloadStudentImportTemplate(classes)}
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              <Download size={14} />
              <span>Download Sample Excel Template</span>
            </button>
          </div>

          <div
            style={{
              padding: 20,
              border: '2px dashed var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              backgroundColor: 'var(--bg-surface-subtle)',
              marginBottom: 16,
            }}
          >
            <FileSpreadsheet size={32} color="var(--brand-primary)" style={{ margin: '0 auto 8px' }} />
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              style={{ fontSize: '13px' }}
            />
            <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: 6 }}>
              Supports headers: First Name, Last Name, Email, Admission Number, Roll Number, Class, Section, Gender, Blood Group
            </div>
          </div>

          {importRows.length > 0 && !importResult && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-primary)' }}>
                  ✓ {importRows.length} rows detected — Previewing first 5 rows:
                </span>
                <span className="badge badge-info">{importRows.length} Total</span>
              </div>
              <div className="table-container" style={{ maxHeight: 180, overflowY: 'auto' }}>
                <table className="data-table" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Adm #</th>
                      <th>Roll #</th>
                      <th>Class</th>
                      <th>Section</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>
                          {row['First Name'] || row.firstName} {row['Last Name'] || row.lastName}
                        </td>
                        <td>{row['Admission Number'] || row['Admission #'] || row.admissionNumber || '-'}</td>
                        <td>{row['Roll Number'] || row['Roll #'] || row.rollNumber || '-'}</td>
                        <td><span className="badge badge-neutral">{row['Class'] || row.className || 'Default'}</span></td>
                        <td>{row['Section'] || row.sectionName || 'Default'}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{row['Email'] || row.email || 'Auto-generated'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {importResult && (
            <div style={{ padding: 14, backgroundColor: 'var(--status-success-bg)', border: '1px solid var(--status-success)', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={18} />
                <span>Import Finished: {importResult.imported || 0} enrolled, {importResult.updated || 0} updated ({importResult.total || 0} processed)</span>
              </div>
              {importResult.errors?.length > 0 && (
                <div style={{ fontSize: '11.5px', color: 'var(--status-danger)', marginTop: 8, maxHeight: 90, overflowY: 'auto' }}>
                  <strong>Warnings / Skipped:</strong>
                  <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                    {importResult.errors.map((e: string, i: number) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
            <button onClick={() => setIsImportOpen(false)} className="btn btn-secondary">
              {importResult ? 'Close' : 'Cancel'}
            </button>
            {importRows.length > 0 && !importResult && (
              <button onClick={handleSaveImport} className="btn btn-primary" disabled={importing}>
                {importing ? 'Importing Data...' : `Commit Import (${importRows.length} Students)`}
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Enroll Student Modal */}
      <Modal isOpen={isEnrollOpen} onClose={() => setIsEnrollOpen(false)} title="Enroll New Student">
        <form onSubmit={handleEnrollStudent}>
          {formError && (
            <div style={{ padding: '10px 14px', backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)', borderRadius: 6, fontSize: '13px', marginBottom: 16 }}>
              {formError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                className="input"
                value={newStudent.firstName}
                onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                className="input"
                value={newStudent.lastName}
                onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Student Email *</label>
              <input
                type="email"
                className="input"
                value={newStudent.email}
                onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Roll Number</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. 05"
                value={newStudent.rollNumber}
                onChange={(e) => setNewStudent({ ...newStudent, rollNumber: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Class / Grade *</label>
              <select
                className="select"
                value={newStudent.classId}
                onChange={(e) => {
                  const targetClass = classes.find((c) => c.id === e.target.value);
                  setNewStudent({
                    ...newStudent,
                    classId: e.target.value,
                    sectionId: targetClass?.sections[0]?.id || '',
                  });
                }}
                required
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Section *</label>
              <select
                className="select"
                value={newStudent.sectionId}
                onChange={(e) => setNewStudent({ ...newStudent, sectionId: e.target.value })}
                required
              >
                {activeClassSections.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                className="select"
                value={newStudent.gender}
                onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. O+"
                value={newStudent.bloodGroup}
                onChange={(e) => setNewStudent({ ...newStudent, bloodGroup: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Admission # (Auto if empty)</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. GVIS-2026-005"
                value={newStudent.admissionNumber}
                onChange={(e) => setNewStudent({ ...newStudent, admissionNumber: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
            <button type="button" onClick={() => setIsEnrollOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={enrolling}>
              {enrolling ? 'Enrolling...' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Auto-Sequence Roll Numbers Modal */}
      <Modal
        isOpen={isAutoRollOpen}
        onClose={() => setIsAutoRollOpen(false)}
        title="Auto-Sequence Roll Numbers Alphabetically"
      >
        <form onSubmit={handleAutoSequenceRoll}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 16 }}>
            Automatically resequences student roll numbers (<strong>01, 02, 03...</strong>) sorted alphabetically by student name for the selected class and section.
          </p>

          {autoRollMessage && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 6,
                fontSize: '13px',
                marginBottom: 16,
                backgroundColor: autoRollSuccess ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
                color: autoRollSuccess ? 'var(--status-success)' : 'var(--status-danger)',
                border: `1px solid ${autoRollSuccess ? 'var(--status-success)' : 'var(--status-danger)'}`,
              }}
            >
              {autoRollMessage}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Select Class *</label>
              <select
                className="select"
                value={autoRollClassId}
                onChange={(e) => {
                  setAutoRollClassId(e.target.value);
                  const cls = classes.find((c) => c.id === e.target.value);
                  setAutoRollSectionId('ALL');
                }}
                required
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Select Section</label>
              <select
                className="select"
                value={autoRollSectionId}
                onChange={(e) => setAutoRollSectionId(e.target.value)}
              >
                <option value="ALL">All Sections in Class</option>
                {(classes.find((c) => c.id === autoRollClassId)?.sections || []).map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
            <button type="button" onClick={() => setIsAutoRollOpen(false)} className="btn btn-secondary">
              {autoRollSuccess ? 'Close' : 'Cancel'}
            </button>
            <button type="submit" className="btn btn-primary" disabled={autoRollLoading}>
              <ArrowDownAZ size={15} />
              <span>{autoRollLoading ? 'Sequencing...' : 'Apply Alphabetical Roll #s'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Assign Emails & Passwords Modal */}
      <Modal
        isOpen={isBulkCredsOpen}
        onClose={() => setIsBulkCredsOpen(false)}
        title="Batch Assign Emails & Passwords"
      >
        <div style={{ maxWidth: 650 }}>
          {!bulkCredsResults ? (
            <form onSubmit={handleBulkAssignCredentials}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 16 }}>
                Generate standardized institutional emails and default login passwords for students across an entire class or the whole school at once.
              </p>

              {bulkCredsMessage && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 6,
                    fontSize: '13px',
                    marginBottom: 16,
                    backgroundColor: bulkCredsMessage.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
                    color: bulkCredsMessage.type === 'success' ? 'var(--status-success)' : 'var(--status-danger)',
                    border: `1px solid ${bulkCredsMessage.type === 'success' ? 'var(--status-success)' : 'var(--status-danger)'}`,
                  }}
                >
                  {bulkCredsMessage.text}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">Target Class</label>
                  <select
                    className="select"
                    value={bulkCredsClassId}
                    onChange={(e) => {
                      setBulkCredsClassId(e.target.value);
                      setBulkCredsSectionId('ALL');
                    }}
                  >
                    <option value="ALL">All Classes in School</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Target Section</label>
                  <select
                    className="select"
                    value={bulkCredsSectionId}
                    disabled={bulkCredsClassId === 'ALL'}
                    onChange={(e) => setBulkCredsSectionId(e.target.value)}
                  >
                    <option value="ALL">All Sections</option>
                    {(classes.find((c) => c.id === bulkCredsClassId)?.sections || []).map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">School Email Domain *</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ padding: '8px 12px', background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)', borderRight: 'none', borderRadius: 'var(--radius-md) 0 0 var(--radius-md)', fontSize: '13px', color: 'var(--text-muted)' }}>@</span>
                  <input
                    type="text"
                    className="input"
                    style={{ borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}
                    value={bulkDomain}
                    onChange={(e) => setBulkDomain(e.target.value)}
                    placeholder="greenwood.edu"
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Email Generation Pattern</label>
                <select
                  className="select"
                  value={emailPattern}
                  onChange={(e) => setEmailPattern(e.target.value as any)}
                >
                  <option value="name">firstname.lastname@domain (e.g. aarav.sharma001@{bulkDomain})</option>
                  <option value="admission">stu.admission_number@domain (e.g. stu.adm202601@{bulkDomain})</option>
                  <option value="roll_class">stu.class.section.roll@domain (e.g. stu.g10.a.01@{bulkDomain})</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Password Policy</label>
                  <select
                    className="select"
                    value={passwordMode}
                    onChange={(e) => setPasswordMode(e.target.value as any)}
                  >
                    <option value="default">Standard Default Password</option>
                    <option value="admission">Dynamic per Student: Pass@Admission#</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Default Password</label>
                  <input
                    type="text"
                    className="input"
                    value={defaultPassword}
                    onChange={(e) => setDefaultPassword(e.target.value)}
                    disabled={passwordMode === 'admission'}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
                <button type="button" onClick={() => setIsBulkCredsOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={bulkCredsLoading}>
                  <KeyRound size={15} />
                  <span>{bulkCredsLoading ? 'Assigning Credentials...' : 'Assign Mails & Passwords'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 6,
                  fontSize: '13px',
                  marginBottom: 16,
                  backgroundColor: 'var(--status-success-bg)',
                  color: 'var(--status-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={18} />
                  <span>Generated credentials for <strong>{bulkCredsResults.length}</strong> students!</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadCredentialsExcel}
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', fontSize: '12px', gap: 6 }}
                >
                  <FileSpreadsheet size={15} />
                  <span>Download Credentials (.xlsx)</span>
                </button>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 12 }}>
                Download the spreadsheet above to distribute login slips to students and parents.
              </p>

              <div className="table-container" style={{ maxHeight: 320, overflowY: 'auto', marginBottom: 16 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Learner</th>
                      <th>Class & Sec</th>
                      <th>Assigned Email</th>
                      <th>Password</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkCredsResults.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{r.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Adm: {r.admissionNumber} • Roll: {r.rollNumber}</div>
                        </td>
                        <td>{r.className} - {r.sectionName}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--brand-primary)' }}>
                          {r.email}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <code style={{ fontSize: '12px', background: 'var(--bg-surface-subtle)', padding: '2px 6px', borderRadius: 4 }}>
                              {r.temporaryPassword}
                            </code>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(`${r.email} / ${r.temporaryPassword}`);
                                setCopiedId(r.id);
                                setTimeout(() => setCopiedId(null), 1500);
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '2px 6px', height: 'auto', fontSize: '10px' }}
                              title="Copy email & password"
                            >
                              {copiedId === r.id ? '✓' : <Copy size={11} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => {
                    setBulkCredsResults(null);
                    setIsBulkCredsOpen(false);
                  }}
                  className="btn btn-secondary"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Student 360° Profile Slide-Over Drawer */}
      <Student360Drawer
        studentId={selectedStudent?.id || null}
        onClose={() => setSelectedStudent(null)}
      />

      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        isSuperAdmin={user?.isSuperAdmin}
      />
    </div>
  );
}
