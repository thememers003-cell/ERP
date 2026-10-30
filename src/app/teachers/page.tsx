'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import CommandPalette from '@/components/CommandPalette';
import Modal from '@/components/Modal';
import Faculty360Drawer from '@/components/Faculty360Drawer';
import { Users, Plus, Building2, GraduationCap, Award, Phone, Mail, Download, Upload, FileSpreadsheet, CheckCircle2, Edit3, Eye } from 'lucide-react';
import { AuthUser } from '@/types';
import { exportToExcel, parseExcelOrCSV } from '@/lib/excel';

export default function TeachersDirectoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  const [selectedDept, setSelectedDept] = useState('ALL');

  // Onboard Teacher Modal
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const [formError, setFormError] = useState('');
  const [newTeacher, setNewTeacher] = useState({
    firstName: '',
    lastName: '',
    email: '',
    employeeCode: '',
    designation: 'Faculty Instructor',
    departmentId: '',
    qualification: 'M.Sc. B.Ed.',
    roleId: '',
    phone: '',
  });

  // Edit Teacher Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    employeeCode: '',
    designation: '',
    departmentId: '',
    qualification: '',
    roleId: '',
    phone: '',
  });

  // Import Excel Modal
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<any>(null);

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

      const [teachRes, deptRes, roleRes] = await Promise.all([
        fetch(`/api/teachers?departmentId=${selectedDept}`),
        fetch('/api/schools/departments'),
        fetch('/api/schools/roles'),
      ]);

      if (teachRes.ok) setTeachers((await teachRes.json()).data);
      if (deptRes.ok) setDepartments((await deptRes.json()).data);
      if (roleRes.ok) setRoles((await roleRes.json()).data.roles);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDept]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboarding(true);
    setFormError('');

    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeacher),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error?.message || 'Failed to onboard teacher');

      setIsOnboardOpen(false);
      setNewTeacher({
        firstName: '',
        lastName: '',
        email: '',
        employeeCode: '',
        designation: 'Faculty Instructor',
        departmentId: '',
        qualification: 'M.Sc. B.Ed.',
        roleId: '',
        phone: '',
      });
      loadData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setOnboarding(false);
    }
  };

  const handleStartEdit = (t: any) => {
    setEditForm({
      id: t.id,
      firstName: t.firstName || '',
      lastName: t.lastName || '',
      email: t.email || '',
      employeeCode: t.employeeCode || '',
      designation: t.designation || '',
      departmentId: t.departmentId || '',
      qualification: t.qualification || '',
      roleId: t.roleId || '',
      phone: t.phone === '-' ? '' : t.phone || '',
    });
    setEditError('');
    setIsEditOpen(true);
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEdit(true);
    setEditError('');

    try {
      const res = await fetch('/api/teachers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error?.message || 'Failed to update faculty member');

      setIsEditOpen(false);
      loadData();
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleExportExcel = () => {
    const exportData = teachers.map((t) => ({
      'Employee Code': t.employeeCode,
      'First Name': t.firstName,
      'Last Name': t.lastName,
      'Email': t.email,
      'Designation': t.designation,
      'Department': t.departmentName,
      'Qualification': t.qualification,
      'Phone': t.phone,
      'Class Teacher Of': t.classTeacherOf,
    }));
    exportToExcel(exportData, `Faculty_Directory_${new Date().toISOString().split('T')[0]}`);
  };

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

  const handleSaveImport = async () => {
    if (importRows.length === 0) return;
    setImporting(true);

    try {
      const res = await fetch('/api/import/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: importRows }),
      });

      const d = await res.json();
      if (res.ok) {
        setImportResult(d.data);
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="app-container">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="main-content">
        <Topbar
          user={user}
          onOpenCommand={() => setIsCommandOpen(true)}
          title="Faculty & Staff Directory"
          subtitle="Teaching Staff & Instructors"
        />

        <div className="page-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Teachers & Staff ({teachers.length})
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Faculty members, designations, department allocations, and assigned system roles.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={handleExportExcel} className="btn btn-secondary" title="Export to Excel">
                <Download size={15} />
                <span>Export Excel</span>
              </button>
              <button onClick={() => { setIsImportOpen(true); setImportRows([]); setImportResult(null); }} className="btn btn-secondary">
                <Upload size={15} />
                <span>Import Excel / CSV</span>
              </button>
              <button onClick={() => setIsOnboardOpen(true)} className="btn btn-primary">
                <Plus size={16} />
                <span>Onboard Faculty</span>
              </button>
            </div>
          </div>

          {/* Department Filter Bar */}
          <div className="card" style={{ marginBottom: '20px', padding: '14px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Filter Department:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="select"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Teachers Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee Code</th>
                  <th>Faculty Name</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Assigned Roles</th>
                  <th>Class / Subjects</th>
                  <th>Contact</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.id}>
                    <td><span className="command-kbd">{t.employeeCode}</span></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{t.firstName} {t.lastName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>{t.email}</div>
                    </td>
                    <td>
                      <span className="badge badge-info">{t.departmentName}</span>
                    </td>
                    <td><strong>{t.designation}</strong></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {t.roles.map((r: string, idx: number) => (
                          <span key={idx} className="badge badge-neutral">{r}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontSize: '12.5px' }}>
                      <div>{t.subjectsTaught}</div>
                      {t.classTeacherOf !== 'None' && (
                        <div style={{ fontSize: '11px', color: 'var(--brand-primary)', fontWeight: 600 }}>
                          Class Teacher: {t.classTeacherOf}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.phone}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setSelectedTeacherId(t.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                          title="View Faculty 360° Dossier"
                        >
                          <Eye size={13} color="var(--brand-primary)" />
                          <span>View 360°</span>
                        </button>
                        <button
                          onClick={() => handleStartEdit(t)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                          title="Edit Faculty Member"
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>
                      </div>
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
        title="Import Teachers via Excel / CSV"
        maxWidth="700px"
      >
        <div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 16 }}>
            Upload a spreadsheet (<strong>.xlsx</strong> or <strong>.csv</strong>). Columns supported: <code>First Name</code>, <code>Last Name</code>, <code>Email</code>, <code>Employee Code</code>, <code>Department</code>, <code>Designation</code>, <code>Phone</code>.
          </p>

          <div
            style={{
              padding: 24,
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
          </div>

          {importRows.length > 0 && !importResult && (
            <div style={{ padding: 12, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 6, marginBottom: 16 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-primary)' }}>
                ✓ {importRows.length} faculty rows parsed!
              </div>
            </div>
          )}

          {importResult && (
            <div style={{ padding: 12, backgroundColor: 'var(--status-success-bg)', border: '1px solid var(--status-success)', borderRadius: 6, marginBottom: 16 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} />
                <span>Successfully onboarded {importResult.imported} teachers in real time!</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
            <button onClick={() => setIsImportOpen(false)} className="btn btn-secondary">
              {importResult ? 'Close' : 'Cancel'}
            </button>
            {importRows.length > 0 && !importResult && (
              <button onClick={handleSaveImport} className="btn btn-primary" disabled={importing}>
                {importing ? 'Importing...' : `Commit Import (${importRows.length} Faculty)`}
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Onboard Teacher Modal */}
      <Modal isOpen={isOnboardOpen} onClose={() => setIsOnboardOpen(false)} title="Onboard Faculty Instructor">
        <form onSubmit={handleOnboard}>
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
                value={newTeacher.firstName}
                onChange={(e) => setNewTeacher({ ...newTeacher, firstName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                className="input"
                value={newTeacher.lastName}
                onChange={(e) => setNewTeacher({ ...newTeacher, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Login Email *</label>
              <input
                type="email"
                className="input"
                value={newTeacher.email}
                onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Employee Code *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. FAC-009"
                value={newTeacher.employeeCode}
                onChange={(e) => setNewTeacher({ ...newTeacher, employeeCode: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                className="select"
                value={newTeacher.departmentId}
                onChange={(e) => setNewTeacher({ ...newTeacher, departmentId: e.target.value })}
              >
                <option value="">Select Department...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Designation</label>
              <input
                type="text"
                className="input"
                value={newTeacher.designation}
                onChange={(e) => setNewTeacher({ ...newTeacher, designation: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">System Role Assignment</label>
              <select
                className="select"
                value={newTeacher.roleId}
                onChange={(e) => setNewTeacher({ ...newTeacher, roleId: e.target.value })}
              >
                <option value="">Default (Subject Teacher)</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Qualifications</label>
              <input
                type="text"
                className="input"
                value={newTeacher.qualification}
                onChange={(e) => setNewTeacher({ ...newTeacher, qualification: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
            <button type="button" onClick={() => setIsOnboardOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={onboarding}>
              {onboarding ? 'Onboarding...' : 'Onboard Teacher'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Faculty Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={editForm.firstName ? `Edit Faculty: ${editForm.firstName} ${editForm.lastName}` : 'Edit Faculty Member'}
      >
        <form onSubmit={handleUpdateTeacher}>
          {editError && (
            <div style={{ padding: '10px 14px', backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)', borderRadius: 6, fontSize: '13px', marginBottom: 16 }}>
              {editError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                className="input"
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                className="input"
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="input"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Employee Code *</label>
              <input
                type="text"
                className="input"
                value={editForm.employeeCode}
                onChange={(e) => setEditForm({ ...editForm, employeeCode: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                className="select"
                value={editForm.departmentId}
                onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
              >
                <option value="">General / None</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Designation</label>
              <input
                type="text"
                className="input"
                value={editForm.designation}
                onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">System Role Assignment</label>
              <select
                className="select"
                value={editForm.roleId}
                onChange={(e) => setEditForm({ ...editForm, roleId: e.target.value })}
              >
                <option value="">Keep Existing Role</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Qualifications</label>
              <input
                type="text"
                className="input"
                value={editForm.qualification}
                onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Contact</label>
            <input
              type="text"
              className="input"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              placeholder="+91 98765 43210"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
            <button type="button" onClick={() => setIsEditOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSavingEdit}>
              {isSavingEdit ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Faculty 360° Profile Slide-Over Drawer */}
      <Faculty360Drawer
        teacherId={selectedTeacherId}
        onClose={() => setSelectedTeacherId(null)}
      />

      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        isSuperAdmin={user?.isSuperAdmin}
      />
    </div>
  );
}
